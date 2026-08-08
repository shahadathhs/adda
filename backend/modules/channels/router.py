"""Channel routes: CRUD + permissions + message history.

Default channels (general, announcements, live) are open to all members.
Custom channels can be restricted — then only explicitly added ChannelMembers
can read/send. Community admins bypass all restrictions.
"""

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.exceptions import ForbiddenException, NotFoundException
from core.security.deps import get_current_user
from models.membership import CommunityRole
from models.message import Message
from models.user import User
from modules.channels.schemas import (
    AddChannelMemberBody,
    ChannelCreate,
    ChannelMemberOut,
    ChannelOut,
    ChannelUpdate,
    MessageOut,
)
from modules.channels.service import commands, queries
from modules.channels.service.queries import ADMIN_ROLES
from modules.communities.service.queries import get_member_role

router = APIRouter(prefix="/communities/{community_id}/channels", tags=["channels"])

DEFAULT_SLUGS = {"general", "announcements", "live"}
MOD_ROLES = {CommunityRole.owner, CommunityRole.admin, CommunityRole.moderator}


async def _role(
    db: AsyncSession, community_id: uuid.UUID, user_id: uuid.UUID
) -> CommunityRole:
    role = await get_member_role(db, community_id, user_id)
    if role is None:
        raise ForbiddenException("Not a member of this community")
    return role


# ── Channel CRUD ──────────────────────────────────────────────────────
@router.get("", response_model=list[ChannelOut])
async def list_channels(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = await _role(db, community_id, current_user.id)
    channels = await queries.list_channels(db, community_id)
    out: list[ChannelOut] = []
    for ch in channels:
        has_access = await queries.check_channel_access(db, ch, current_user.id, role)
        out.append(
            ChannelOut(
                id=ch.id,
                community_id=ch.community_id,
                name=ch.name,
                slug=ch.slug,
                type=ch.type,
                position=ch.position,
                is_restricted=ch.is_restricted,
                has_access=has_access,
                created_at=ch.created_at,
            )
        )
    return out


@router.post("", response_model=ChannelOut, status_code=status.HTTP_201_CREATED)
async def create_channel(
    community_id: uuid.UUID,
    data: ChannelCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = await _role(db, community_id, current_user.id)
    if role not in ADMIN_ROLES:
        raise ForbiddenException("Only admins can create channels")
    ch = await commands.create_channel(db, community_id, data)
    return ChannelOut(
        **{
            k: getattr(ch, k)
            for k in (
                "id", "community_id", "name", "slug", "type",
                "position", "is_restricted", "created_at",
            )
        },
        has_access=True,
    )


@router.patch("/{channel_id}", response_model=ChannelOut)
async def update_channel(
    community_id: uuid.UUID,
    channel_id: uuid.UUID,
    data: ChannelUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = await _role(db, community_id, current_user.id)
    if role not in ADMIN_ROLES:
        raise ForbiddenException("Only admins can edit channels")
    ch = await queries.get_channel(db, channel_id)
    if ch is None or ch.community_id != community_id:
        raise NotFoundException("Channel not found")
    ch = await commands.update_channel(db, ch, data)
    return ChannelOut(
        **{
            k: getattr(ch, k)
            for k in (
                "id", "community_id", "name", "slug", "type",
                "position", "is_restricted", "created_at",
            )
        },
        has_access=True,
    )


@router.delete("/{channel_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_channel(
    community_id: uuid.UUID,
    channel_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = await _role(db, community_id, current_user.id)
    if role not in ADMIN_ROLES:
        raise ForbiddenException("Only admins can delete channels")
    ch = await queries.get_channel(db, channel_id)
    if ch is None or ch.community_id != community_id:
        raise NotFoundException("Channel not found")
    if ch.slug in DEFAULT_SLUGS:
        raise ForbiddenException("Default channels cannot be deleted")
    await commands.delete_channel(db, ch)


# ── Messages ──────────────────────────────────────────────────────────
@router.get("/{channel_id}/messages", response_model=list[MessageOut])
async def list_messages(
    community_id: uuid.UUID,
    channel_id: uuid.UUID,
    before: uuid.UUID | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = await _role(db, community_id, current_user.id)
    ch = await queries.get_channel(db, channel_id)
    if ch is None or ch.community_id != community_id:
        raise NotFoundException("Channel not found")
    if not await queries.check_channel_access(db, ch, current_user.id, role):
        raise ForbiddenException("You don't have access to this channel")
    return await queries.get_channel_messages(
        db, channel_id, before=before, limit=limit
    )


@router.delete(
    "/{channel_id}/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_message(
    community_id: uuid.UUID,
    channel_id: uuid.UUID,
    message_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = await _role(db, community_id, current_user.id)
    msg = await db.get(Message, message_id)
    if msg is None or msg.channel_id != channel_id:
        raise NotFoundException("Message not found")
    if msg.user_id != current_user.id and role not in MOD_ROLES:
        raise ForbiddenException("You can only delete your own messages")
    await commands.delete_message(db, msg)


# ── Channel member management ─────────────────────────────────────────
@router.get("/{channel_id}/members", response_model=list[ChannelMemberOut])
async def list_channel_members(
    community_id: uuid.UUID,
    channel_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = await _role(db, community_id, current_user.id)
    if role not in ADMIN_ROLES:
        raise ForbiddenException("Only admins can manage channel members")
    ch = await queries.get_channel(db, channel_id)
    if ch is None or ch.community_id != community_id:
        raise NotFoundException("Channel not found")
    return await queries.list_channel_members(db, channel_id)


@router.post(
    "/{channel_id}/members",
    response_model=ChannelMemberOut,
    status_code=status.HTTP_201_CREATED,
)
async def add_member(
    community_id: uuid.UUID,
    channel_id: uuid.UUID,
    data: AddChannelMemberBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = await _role(db, community_id, current_user.id)
    if role not in ADMIN_ROLES:
        raise ForbiddenException("Only admins can add channel members")
    ch = await queries.get_channel(db, channel_id)
    if ch is None or ch.community_id != community_id:
        raise NotFoundException("Channel not found")
    member = await commands.add_channel_member(
        db, channel_id, data.user_id, data.can_read, data.can_write
    )
    # Fetch username/display_name for response.
    user = await db.get(User, data.user_id)
    if user is None:
        raise NotFoundException("User not found")
    return ChannelMemberOut(
        user_id=member.user_id,
        username=user.username,
        display_name=user.display_name,
        can_read=member.can_read,
        can_write=member.can_write,
    )


@router.delete(
    "/{channel_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def remove_member(
    community_id: uuid.UUID,
    channel_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = await _role(db, community_id, current_user.id)
    if role not in ADMIN_ROLES:
        raise ForbiddenException("Only admins can remove channel members")
    ch = await queries.get_channel(db, channel_id)
    if ch is None or ch.community_id != community_id:
        raise NotFoundException("Channel not found")
    await commands.remove_channel_member(db, channel_id, user_id)
