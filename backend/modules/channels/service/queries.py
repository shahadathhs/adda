"""Channel + message queries (read operations)."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.channel import Channel
from models.channel_member import ChannelMember
from models.membership import CommunityRole
from models.message import Message
from models.user import User
from modules.channels.schemas import ChannelMemberOut, MessageOut

ADMIN_ROLES = {CommunityRole.owner, CommunityRole.admin}


async def list_channels(
    db: AsyncSession, community_id: uuid.UUID
) -> list[Channel]:
    result = await db.execute(
        select(Channel)
        .where(Channel.community_id == community_id)
        .order_by(Channel.position, Channel.created_at)
    )
    return list(result.scalars().all())


async def get_channel(
    db: AsyncSession, channel_id: uuid.UUID
) -> Channel | None:
    result = await db.execute(select(Channel).where(Channel.id == channel_id))
    return result.scalar_one_or_none()


async def check_channel_access(
    db: AsyncSession,
    channel: Channel,
    user_id: uuid.UUID,
    role: CommunityRole | None,
) -> bool:
    """True if the user can read this channel."""
    if role is None:
        return False
    if role in ADMIN_ROLES:
        return True
    if not channel.is_restricted:
        return True
    # Restricted: need an explicit ChannelMember grant.
    result = await db.execute(
        select(ChannelMember).where(
            ChannelMember.channel_id == channel.id,
            ChannelMember.user_id == user_id,
            ChannelMember.can_read.is_(True),
        )
    )
    return result.scalar_one_or_none() is not None


async def get_channel_messages(
    db: AsyncSession,
    channel_id: uuid.UUID,
    *,
    before: uuid.UUID | None = None,
    limit: int = 50,
) -> list[MessageOut]:
    stmt = (
        select(Message, User)
        .join(User, Message.user_id == User.id)
        .where(Message.channel_id == channel_id)
        .order_by(Message.created_at.desc())
        .limit(limit)
    )
    if before is not None:
        stmt = stmt.where(Message.id < before)

    result = await db.execute(stmt)
    return [
        MessageOut(
            id=msg.id,
            channel_id=msg.channel_id,
            user_id=msg.user_id,
            username=user.username,
            display_name=user.display_name,
            content=msg.content,
            reply_to_id=msg.reply_to_id,
            created_at=msg.created_at,
            edited_at=msg.edited_at,
        )
        for msg, user in result.all()
    ]


async def list_channel_members(
    db: AsyncSession, channel_id: uuid.UUID
) -> list[ChannelMemberOut]:
    result = await db.execute(
        select(ChannelMember, User)
        .join(User, ChannelMember.user_id == User.id)
        .where(ChannelMember.channel_id == channel_id)
        .order_by(User.username)
    )
    return [
        ChannelMemberOut(
            user_id=cm.user_id,
            username=user.username,
            display_name=user.display_name,
            can_read=cm.can_read,
            can_write=cm.can_write,
        )
        for cm, user in result.all()
    ]
