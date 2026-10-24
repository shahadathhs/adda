"""Community routes: CRUD, stream-key management, follows, and moderators."""

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.exceptions import (
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
)
from core.security.deps import get_current_user
from models.community import Community
from models.user import SystemRole, User
from modules.communities.schemas import (
    AddModeratorBody,
    CommunityCreate,
    CommunityOut,
    CommunityUpdate,
    FollowerOut,
    ModeratorOut,
    StreamCredentialsOut,
)
from modules.communities.service.commands import (
    create_community,
    delete_community,
    update_community,
)
from modules.communities.service.follows import (
    count_followers,
    follow_community,
    is_following,
    list_followed_communities,
    list_followers,
    unfollow_community,
)
from modules.communities.service.queries import (
    get_community,
    get_community_by_slug,
    list_communities,
    list_my_communities,
)
from modules.communities.service.roles import (
    add_moderator,
    list_moderators,
    remove_moderator,
)
from modules.communities.service.stream_keys import (
    build_stream_credentials,
    regenerate_stream_key,
)
from modules.streaming.service.mediamtx import kick_publisher
from modules.streaming.service.playback import is_community_live

router = APIRouter(prefix="/communities", tags=["communities"])


async def _serialize(db: AsyncSession, community: Community) -> CommunityOut:
    follower_count = await count_followers(db, community.id)
    live = await is_community_live(str(community.id))
    data = community.to_public_dict(is_live=live, follower_count=follower_count)
    return CommunityOut.model_validate(data, from_attributes=True)


async def _get_manageable_community(
    community_id: uuid.UUID, current_user: User, db: AsyncSession
) -> Community:
    """The channel, if the user owns it or is system staff; otherwise 403/404."""
    community = await get_community(db, community_id)
    if community is None:
        raise NotFoundException("Community not found")
    if community.owner_id != current_user.id and current_user.system_role not in SystemRole.STAFF:
        raise ForbiddenException("Only the channel owner can do this")
    return community


async def _get_owned_community(
    community_id: uuid.UUID, current_user: User, db: AsyncSession
) -> Community:
    """Channel the user may manage streams for: its owner, or system staff."""
    community = await get_community(db, community_id)
    if community is None:
        raise NotFoundException("Community not found")
    if current_user.system_role in SystemRole.STAFF:
        return community
    if community.owner_id != current_user.id:
        raise ForbiddenException("Only the channel owner can manage the stream key")
    return community


@router.get("/mine", response_model=list[CommunityOut])
async def list_mine(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Channels the current user owns or moderates: the studio's channel picker."""
    out: list[CommunityOut] = []
    for community, role in await list_my_communities(db, current_user.id):
        item = await _serialize(db, community)
        item.my_role = role
        out.append(item)
    return out


# ── Communities ───────────────────────────────────────────────────────
@router.get("", response_model=list[CommunityOut])
@router.get("/", response_model=list[CommunityOut], include_in_schema=False)
async def list_all(limit: int = 50, offset: int = 0, db: AsyncSession = Depends(get_db)):
    communities = await list_communities(db, limit=limit, offset=offset)
    return [await _serialize(db, c) for c in communities]


@router.post("", response_model=CommunityOut, status_code=status.HTTP_201_CREATED)
async def create(
    data: CommunityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if await get_community_by_slug(db, data.slug):
        raise ConflictException("Slug already taken")
    community = await create_community(db, data, current_user.id)
    return await _serialize(db, community)


@router.get("/by-slug/{slug}", response_model=CommunityOut)
async def get_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    """Public lookup by slug — used for pretty channel URLs (/channel/<slug>)."""
    community = await get_community_by_slug(db, slug)
    if community is None:
        raise NotFoundException("Community not found")
    return await _serialize(db, community)


@router.get("/followed/by-me", response_model=list[CommunityOut])
async def list_followed(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Channels the current user follows (for their following rail/homepage)."""
    communities = await list_followed_communities(db, current_user.id)
    return [await _serialize(db, c) for c in communities]


@router.get("/{community_id}", response_model=CommunityOut)
async def get_one(community_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    community = await get_community(db, community_id)
    if community is None:
        raise NotFoundException("Community not found")
    return await _serialize(db, community)


@router.patch("/{community_id}", response_model=CommunityOut)
async def update(
    community_id: uuid.UUID,
    data: CommunityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    community = await get_community(db, community_id)
    if community is None:
        raise NotFoundException("Community not found")
    if community.owner_id != current_user.id and current_user.system_role not in SystemRole.STAFF:
        raise ForbiddenException("Only the owner can update this community")
    community = await update_community(db, community, data)
    return await _serialize(db, community)


@router.delete("/{community_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    community = await get_community(db, community_id)
    if community is None:
        raise NotFoundException("Community not found")
    if community.owner_id != current_user.id and current_user.system_role not in SystemRole.STAFF:
        raise ForbiddenException("Only the owner can delete this community")
    await delete_community(db, community)


# ── Stream keys ───────────────────────────────────────────────────────
@router.get("/{community_id}/stream-key", response_model=StreamCredentialsOut)
async def get_stream_key(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    community = await _get_owned_community(community_id, current_user, db)
    return build_stream_credentials(community)


@router.post("/{community_id}/stream-key/rotate", response_model=StreamCredentialsOut)
async def rotate_stream_key(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    community = await _get_owned_community(community_id, current_user, db)
    community = await regenerate_stream_key(db, community)
    # Drop the current OBS connection so the new key takes effect now;
    # reconnecting requires the rotated key (the old one is dead in the DB).
    await kick_publisher(str(community.id))
    return build_stream_credentials(community)


# ── Follows ───────────────────────────────────────────────────────────
@router.get("/{community_id}/followers", response_model=list[FollowerOut])
async def channel_followers(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> list[FollowerOut]:
    """Public follower list for the channel page's Followers tab."""
    followers = await list_followers(db, community_id)
    return [
        FollowerOut(
            id=str(u.id),
            username=u.username,
            display_name=u.display_name,
            avatar_url=u.avatar_url,
        )
        for u in followers
    ]


@router.get("/{community_id}/follow")
async def follow_state(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return {"following": await is_following(db, community_id, current_user.id)}


@router.post("/{community_id}/follow", status_code=status.HTTP_201_CREATED)
async def follow(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    community = await get_community(db, community_id)
    if community is None:
        raise NotFoundException("Community not found")
    # Idempotent: following twice leaves one follow and the same answer.
    if not await is_following(db, community_id, current_user.id):
        await follow_community(db, community_id, current_user.id)
    return {"following": True, "follower_count": await count_followers(db, community_id)}


@router.delete("/{community_id}/follow", status_code=status.HTTP_204_NO_CONTENT)
async def unfollow(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Idempotent: unfollowing when not following is a no-op.
    await unfollow_community(db, community_id, current_user.id)


# ── Moderators ────────────────────────────────────────────────────────
@router.get("/{community_id}/moderators", response_model=list[ModeratorOut])
async def moderators(community_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Public: viewers see who moderates a channel (badges, profile page)."""
    if await get_community(db, community_id) is None:
        raise NotFoundException("Community not found")
    return [
        ModeratorOut(
            user_id=u.id,
            username=u.username,
            display_name=u.display_name,
            avatar_url=u.avatar_url,
            since=m.created_at,
        )
        for m, u in await list_moderators(db, community_id)
    ]


@router.post(
    "/{community_id}/moderators",
    response_model=ModeratorOut,
    status_code=status.HTTP_201_CREATED,
)
async def make_moderator(
    community_id: uuid.UUID,
    data: AddModeratorBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Owner (or staff) makes one of the channel's followers a moderator. Idempotent."""
    community = await _get_manageable_community(community_id, current_user, db)
    if data.user_id == community.owner_id:
        raise BadRequestException("The owner already has every moderator power")
    user = await db.get(User, data.user_id)
    if user is None:
        raise NotFoundException("User not found")
    if not await is_following(db, community_id, user.id):
        raise BadRequestException("Only people who follow the channel can be made moderators")
    await add_moderator(db, community_id, user.id)
    found = [(m, u) for m, u in await list_moderators(db, community_id) if u.id == user.id]
    m, u = found[0]
    return ModeratorOut(
        user_id=u.id,
        username=u.username,
        display_name=u.display_name,
        avatar_url=u.avatar_url,
        since=m.created_at,
    )


@router.delete("/{community_id}/moderators/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_a_moderator(
    community_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Owner (or staff) removes a moderator; a moderator may also resign. Idempotent."""
    community = await get_community(db, community_id)
    if community is None:
        raise NotFoundException("Community not found")
    resigning = user_id == current_user.id
    if not resigning:
        await _get_manageable_community(community_id, current_user, db)
    await remove_moderator(db, community_id, user_id)
