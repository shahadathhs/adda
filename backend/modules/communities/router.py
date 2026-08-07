"""Community routes: CRUD, stream-key management, and membership (join/leave/list)."""
import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import ConflictException, ForbiddenException, NotFoundException
from core.security.deps import get_current_user
from core.database import get_db
from models.community import Community
from models.user import User
from modules.communities.schemas import (
    CommunityCreate,
    CommunityOut,
    CommunityUpdate,
    StreamCredentialsOut,
)
from modules.communities.service.commands import (
    create_community,
    delete_community,
    update_community,
)
from modules.communities.service.memberships import (
    get_membership,
    join_community,
    leave_community,
    list_members as list_members_service,
)
from modules.communities.service.queries import (
    count_members,
    get_community,
    get_community_by_slug,
    list_communities,
)
from modules.communities.service.stream_keys import (
    build_stream_credentials,
    regenerate_stream_key,
)
from modules.streaming.service.mediamtx import kick_publisher
from modules.streaming.service.playback import is_community_live
from modules.users.schemas import UserOut

router = APIRouter(prefix="/communities", tags=["communities"])


async def _serialize(db: AsyncSession, community: Community) -> CommunityOut:
    member_count = await count_members(db, community.id)
    live = await is_community_live(str(community.id))
    data = community.to_public_dict(member_count=member_count, is_live=live)
    return CommunityOut.model_validate(data, from_attributes=True)


async def _get_owned_community(
    community_id: uuid.UUID, current_user: User, db: AsyncSession
) -> Community:
    community = await get_community(db, community_id)
    if community is None:
        raise NotFoundException("Community not found")
    if community.owner_id != current_user.id and not current_user.is_admin:
        raise ForbiddenException("Only the owner can view or rotate the stream key")
    return community


# ── Communities ───────────────────────────────────────────────────────
@router.get("", response_model=list[CommunityOut])
@router.get("/", response_model=list[CommunityOut], include_in_schema=False)
async def list_all(
    limit: int = 50, offset: int = 0, db: AsyncSession = Depends(get_db)
):
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
    if community.owner_id != current_user.id and not current_user.is_admin:
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
    if community.owner_id != current_user.id and not current_user.is_admin:
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


# ── Members ───────────────────────────────────────────────────────────
@router.get(
    "/{community_id}/members", response_model=list[UserOut], tags=["members"]
)
async def list_members(community_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    memberships = await list_members_service(db, community_id)
    users: list[UserOut] = []
    for m in memberships:
        await db.refresh(m, attribute_names=["user"])
        if m.user is not None:
            users.append(UserOut.model_validate(m.user, from_attributes=True))
    return users


@router.post(
    "/{community_id}/members",
    status_code=status.HTTP_201_CREATED,
    response_model=UserOut,
    tags=["members"],
)
async def join(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    community = await get_community(db, community_id)
    if community is None:
        raise NotFoundException("Community not found")

    existing = await get_membership(db, community_id, current_user.id)
    if existing is not None:
        raise ConflictException("Already a member")

    await join_community(db, community_id, current_user.id)
    return UserOut.model_validate(current_user, from_attributes=True)


@router.delete(
    "/{community_id}/members", status_code=status.HTTP_204_NO_CONTENT, tags=["members"]
)
async def leave(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    membership = await get_membership(db, community_id, current_user.id)
    if membership is None:
        raise NotFoundException("Not a member")
    await leave_community(db, membership)
