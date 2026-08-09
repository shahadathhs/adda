"""Channel + message commands (write operations)."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from models.channel import Channel
from models.channel_member import ChannelMember
from models.message import Message
from modules.channels.schemas import ChannelCreate, ChannelUpdate

DEFAULT_SLUGS = {"general", "announcements", "live"}


async def create_channel(db: AsyncSession, community_id: uuid.UUID, data: ChannelCreate) -> Channel:
    channel = Channel(
        community_id=community_id,
        name=data.name,
        slug=data.slug,
        type=data.type,
        position=data.position,
        is_restricted=data.is_restricted,
    )
    db.add(channel)
    await db.commit()
    await db.refresh(channel)
    return channel


async def update_channel(db: AsyncSession, channel: Channel, data: ChannelUpdate) -> Channel:
    for field in ("name", "position", "is_restricted"):
        value = getattr(data, field)
        if value is not None:
            setattr(channel, field, value)
    await db.commit()
    await db.refresh(channel)
    return channel


async def delete_channel(db: AsyncSession, channel: Channel) -> None:
    await db.delete(channel)
    await db.commit()


async def delete_message(db: AsyncSession, message: Message) -> None:
    await db.delete(message)
    await db.commit()


async def add_channel_member(
    db: AsyncSession,
    channel_id: uuid.UUID,
    user_id: uuid.UUID,
    can_read: bool = True,
    can_write: bool = True,
) -> ChannelMember:
    member = ChannelMember(
        channel_id=channel_id,
        user_id=user_id,
        can_read=can_read,
        can_write=can_write,
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return member


async def remove_channel_member(
    db: AsyncSession, channel_id: uuid.UUID, user_id: uuid.UUID
) -> None:
    from sqlalchemy import delete as sa_delete

    await db.execute(
        sa_delete(ChannelMember).where(
            ChannelMember.channel_id == channel_id,
            ChannelMember.user_id == user_id,
        )
    )
    await db.commit()
