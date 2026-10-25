"""Channel roles: the owner is `Community.owner_id`; moderators are `ChannelModerator` rows."""

import uuid
from typing import Literal

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.channel_moderator import ChannelModerator
from models.community import Community
from models.user import SystemRole, User

ChannelRole = Literal["owner", "moderator"]


async def is_moderator(db: AsyncSession, community_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    result = await db.execute(
        select(ChannelModerator.id).where(
            ChannelModerator.community_id == community_id, ChannelModerator.user_id == user_id
        )
    )
    return result.scalar_one_or_none() is not None


async def channel_role(
    db: AsyncSession, community: Community, user_id: uuid.UUID
) -> ChannelRole | None:
    """The user's role on this channel, or None for an ordinary viewer."""
    if community.owner_id == user_id:
        return "owner"
    if await is_moderator(db, community.id, user_id):
        return "moderator"
    return None


async def can_moderate(db: AsyncSession, community: Community, user: User) -> bool:
    """Owner, moderator, or system staff."""
    if user.system_role in SystemRole.STAFF:
        return True
    return await channel_role(db, community, user.id) is not None


async def list_moderators(
    db: AsyncSession, community_id: uuid.UUID
) -> list[tuple[ChannelModerator, User]]:
    result = await db.execute(
        select(ChannelModerator, User)
        .join(User, ChannelModerator.user_id == User.id)
        .where(ChannelModerator.community_id == community_id)
        .order_by(ChannelModerator.created_at)
    )
    return [(m, u) for m, u in result.all()]


async def add_moderator(db: AsyncSession, community_id: uuid.UUID, user_id: uuid.UUID) -> None:
    if not await is_moderator(db, community_id, user_id):
        db.add(ChannelModerator(community_id=community_id, user_id=user_id))
        await db.commit()


async def remove_moderator(db: AsyncSession, community_id: uuid.UUID, user_id: uuid.UUID) -> None:
    await db.execute(
        delete(ChannelModerator).where(
            ChannelModerator.community_id == community_id, ChannelModerator.user_id == user_id
        )
    )
    await db.commit()
