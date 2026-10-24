"""Badges shown next to a chat name: owner, moderator, follower. Computed, never stored."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.channel_moderator import ChannelModerator
from models.community import Community
from models.follow import Follow


async def badges_for(
    db: AsyncSession, community: Community, user_ids: set[uuid.UUID]
) -> dict[uuid.UUID, list[str]]:
    """Badges for many users of one channel in two queries."""
    if not user_ids:
        return {}
    mods = set(
        (
            await db.execute(
                select(ChannelModerator.user_id).where(
                    ChannelModerator.community_id == community.id,
                    ChannelModerator.user_id.in_(user_ids),
                )
            )
        ).scalars()
    )
    followers = set(
        (
            await db.execute(
                select(Follow.user_id).where(
                    Follow.community_id == community.id, Follow.user_id.in_(user_ids)
                )
            )
        ).scalars()
    )
    result: dict[uuid.UUID, list[str]] = {}
    for uid in user_ids:
        badges: list[str] = []
        if uid == community.owner_id:
            badges.append("owner")
        if uid in mods:
            badges.append("moderator")
        if uid in followers:
            badges.append("follower")
        result[uid] = badges
    return result
