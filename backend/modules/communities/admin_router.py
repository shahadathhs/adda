"""Admin community-management routes (gated by `require_admin` at the router level)."""

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.exceptions import BadRequestException, NotFoundException
from core.security.guards import require_admin
from models.community import Community
from models.membership import CommunityRole
from modules.communities.schemas import (
    AdminCommunityOut,
    AdminCommunityUpdate,
    MemberOut,
    StreamCredentialsOut,
)
from modules.communities.service.commands import delete_community
from modules.communities.service.memberships import (
    get_membership,
    leave_community,
)
from modules.communities.service.memberships import (
    list_members as list_members_service,
)
from modules.communities.service.queries import (
    count_members,
    get_community,
    list_all_communities,
)
from modules.communities.service.stream_keys import (
    build_stream_credentials,
    regenerate_stream_key,
)
from modules.streaming.service.mediamtx import kick_publisher
from modules.streaming.service.playback import is_community_live

router = APIRouter(
    prefix="/admin/communities",
    tags=["admin-communities"],
    dependencies=[Depends(require_admin)],
)


async def _community_out(db: AsyncSession, c: Community) -> AdminCommunityOut:
    return AdminCommunityOut(
        id=c.id,
        name=c.name,
        slug=c.slug,
        owner_id=c.owner_id,
        member_count=await count_members(db, c.id),
        is_live=await is_community_live(str(c.id)),
        is_suspended=c.is_suspended,
        created_at=c.created_at,
    )


async def _get_community_or_404(db: AsyncSession, community_id: uuid.UUID) -> Community:
    c = await get_community(db, community_id)
    if c is None:
        raise NotFoundException("Community not found")
    return c


@router.get("", response_model=list[AdminCommunityOut])
@router.get("/", response_model=list[AdminCommunityOut], include_in_schema=False)
async def list_communities(
    db: AsyncSession = Depends(get_db),
) -> list[AdminCommunityOut]:
    return [await _community_out(db, c) for c in await list_all_communities(db)]


@router.patch("/{community_id}", response_model=AdminCommunityOut)
async def update_community(
    community_id: uuid.UUID,
    data: AdminCommunityUpdate,
    db: AsyncSession = Depends(get_db),
) -> AdminCommunityOut:
    c = await _get_community_or_404(db, community_id)
    for field in ("name", "description", "is_private", "is_suspended"):
        value = getattr(data, field)
        if value is not None:
            setattr(c, field, value)
    await db.commit()
    await db.refresh(c)
    return await _community_out(db, c)


@router.get("/{community_id}/members", response_model=list[MemberOut])
async def list_members(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> list[MemberOut]:
    out: list[MemberOut] = []
    for m in await list_members_service(db, community_id):
        await db.refresh(m, attribute_names=["user"])
        if m.user is not None:
            out.append(
                MemberOut(
                    user_id=m.user_id,
                    username=m.user.username,
                    display_name=m.user.display_name,
                    role=m.role.value,
                    joined_at=m.created_at,
                )
            )
    return out


@router.delete("/{community_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def kick_member(
    community_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> None:
    membership = await get_membership(db, community_id, user_id)
    if membership is None:
        raise NotFoundException("Member not found")
    if membership.role == CommunityRole.owner:
        raise BadRequestException(
            "Can't remove the owner; transfer ownership or delete the community"
        )
    await leave_community(db, membership)


@router.get("/{community_id}/stream-key", response_model=StreamCredentialsOut)
async def view_stream_key(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> StreamCredentialsOut:
    c = await _get_community_or_404(db, community_id)
    return build_stream_credentials(c)


@router.post("/{community_id}/stream-key/rotate", response_model=StreamCredentialsOut)
async def rotate_stream_key(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> StreamCredentialsOut:
    c = await _get_community_or_404(db, community_id)
    c = await regenerate_stream_key(db, c)
    await kick_publisher(str(c.id))  # force the old key to stop working now
    return build_stream_credentials(c)


@router.delete("/{community_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_community_endpoint(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> None:
    c = await _get_community_or_404(db, community_id)
    await delete_community(db, c)
