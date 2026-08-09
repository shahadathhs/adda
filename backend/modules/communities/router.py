"""Community routes: CRUD, stream-key management, and membership (join/leave/list)."""

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.exceptions import ConflictException, ForbiddenException, NotFoundException
from core.security.deps import get_current_user
from models.community import Community
from models.membership import CommunityRole
from models.user import SystemRole, User
from modules.communities.schemas import (
    CommunityCreate,
    CommunityOut,
    CommunityUpdate,
    JoinRequestOut,
    MemberOut,
    RoleUpdateBody,
    StreamCredentialsOut,
)
from modules.communities.service.commands import (
    create_community,
    delete_community,
    update_community,
)
from modules.communities.service.memberships import (
    approve_join_request,
    create_join_request,
    deny_join_request,
    get_join_request,
    get_membership,
    has_pending_request,
    join_community,
    leave_community,
    list_pending_join_requests,
    update_member_role,
)
from modules.communities.service.memberships import (
    list_members as list_members_service,
)
from modules.communities.service.queries import (
    count_members,
    get_community,
    get_community_by_slug,
    get_member_role,
    list_communities,
)
from modules.communities.service.stream_keys import (
    build_stream_credentials,
    regenerate_stream_key,
)
from modules.streaming.service.mediamtx import kick_publisher
from modules.streaming.service.playback import is_community_live

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
    if community.owner_id != current_user.id and current_user.system_role not in SystemRole.STAFF:
        raise ForbiddenException("Only the owner can view or rotate the stream key")
    return community


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


# ── Members ───────────────────────────────────────────────────────────
ADMIN_ROLES = {CommunityRole.owner, CommunityRole.admin}


@router.get("/{community_id}/members", response_model=list[MemberOut], tags=["members"])
async def list_members(community_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    memberships = await list_members_service(db, community_id)
    out: list[MemberOut] = []
    for m in memberships:
        await db.refresh(m, attribute_names=["user"])
        if m.user is not None:
            out.append(
                MemberOut(
                    user_id=m.user_id,
                    username=m.user.username,
                    display_name=m.user.display_name,
                    avatar_url=m.user.avatar_url,
                    bio=m.user.bio,
                    role=m.role.value,
                    joined_at=m.created_at,
                )
            )
    return out


@router.post(
    "/{community_id}/members",
    status_code=status.HTTP_201_CREATED,
    tags=["members"],
)
async def join_or_request(
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

    if community.is_private:
        if await has_pending_request(db, community_id, current_user.id):
            raise ConflictException("Join request already pending")
        await create_join_request(db, community_id, current_user.id)
        return {"status": "pending"}

    await join_community(db, community_id, current_user.id)
    return {"status": "joined"}


@router.delete("/{community_id}/members", status_code=status.HTTP_204_NO_CONTENT, tags=["members"])
async def leave(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    membership = await get_membership(db, community_id, current_user.id)
    if membership is None:
        raise NotFoundException("Not a member")
    await leave_community(db, membership)


# ── Role management (admin+) ──────────────────────────────────────────
@router.patch(
    "/{community_id}/members/{user_id}",
    response_model=MemberOut,
    tags=["members"],
)
async def change_role(
    community_id: uuid.UUID,
    user_id: uuid.UUID,
    data: RoleUpdateBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    my_role = await get_member_role(db, community_id, current_user.id)
    if my_role not in ADMIN_ROLES:
        raise ForbiddenException("Only admins can manage roles")
    membership = await get_membership(db, community_id, user_id)
    if membership is None:
        raise NotFoundException("Member not found")
    if membership.role == CommunityRole.owner:
        raise ForbiddenException("Can't change the owner's role")
    if user_id == current_user.id:
        raise ForbiddenException("Can't change your own role")
    await update_member_role(db, membership, data.role)
    await db.refresh(membership, attribute_names=["user"])
    return MemberOut(
        user_id=membership.user_id,
        username=membership.user.username,
        display_name=membership.user.display_name,
        avatar_url=membership.user.avatar_url,
        bio=membership.user.bio,
        role=membership.role.value,
        joined_at=membership.created_at,
    )


@router.delete(
    "/{community_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["members"],
)
async def kick_member(
    community_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    my_role = await get_member_role(db, community_id, current_user.id)
    if my_role not in ADMIN_ROLES:
        raise ForbiddenException("Only admins can kick members")
    membership = await get_membership(db, community_id, user_id)
    if membership is None:
        raise NotFoundException("Member not found")
    if membership.role == CommunityRole.owner:
        raise ForbiddenException("Can't kick the owner")
    if user_id == current_user.id:
        raise ForbiddenException("Can't kick yourself")
    await leave_community(db, membership)


# ── Join requests (private communities, admin+) ───────────────────────
@router.get(
    "/{community_id}/join-requests",
    response_model=list[JoinRequestOut],
    tags=["members"],
)
async def list_join_requests(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    my_role = await get_member_role(db, community_id, current_user.id)
    if my_role not in ADMIN_ROLES:
        raise ForbiddenException("Only admins can view join requests")
    requests = await list_pending_join_requests(db, community_id)
    out: list[JoinRequestOut] = []
    for r in requests:
        user = await db.get(User, r.user_id)
        if user is not None:
            out.append(
                JoinRequestOut(
                    id=r.id,
                    user_id=r.user_id,
                    username=user.username,
                    display_name=user.display_name,
                    avatar_url=user.avatar_url,
                    status=r.status,
                    created_at=r.created_at,
                )
            )
    return out


@router.post(
    "/{community_id}/join-requests/{request_id}/approve",
    response_model=MemberOut,
    tags=["members"],
)
async def approve_request(
    community_id: uuid.UUID,
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    my_role = await get_member_role(db, community_id, current_user.id)
    if my_role not in ADMIN_ROLES:
        raise ForbiddenException("Only admins can approve requests")
    request = await get_join_request(db, request_id)
    if request is None or request.community_id != community_id:
        raise NotFoundException("Join request not found")
    membership = await approve_join_request(db, request)
    await db.refresh(membership, attribute_names=["user"])
    return MemberOut(
        user_id=membership.user_id,
        username=membership.user.username,
        display_name=membership.user.display_name,
        avatar_url=membership.user.avatar_url,
        bio=membership.user.bio,
        role=membership.role.value,
        joined_at=membership.created_at,
    )


@router.post(
    "/{community_id}/join-requests/{request_id}/deny",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["members"],
)
async def deny_request(
    community_id: uuid.UUID,
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    my_role = await get_member_role(db, community_id, current_user.id)
    if my_role not in ADMIN_ROLES:
        raise ForbiddenException("Only admins can deny requests")
    request = await get_join_request(db, request_id)
    if request is None or request.community_id != community_id:
        raise NotFoundException("Join request not found")
    await deny_join_request(db, request)
