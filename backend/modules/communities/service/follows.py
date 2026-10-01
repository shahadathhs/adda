"""Follow relationships: users following communities (channels)."""

import uuid

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.community import Community
from models.follow import Follow


async def follow_community(db: AsyncSession, community_id: uuid.UUID, user_id: uuid.UUID) -> Follow:
    follow = Follow(user_id=user_id, community_id=community_id)
    db.add(follow)
    await db.commit()
    await db.refresh(follow)
    return follow


async def unfollow_community(db: AsyncSession, community_id: uuid.UUID, user_id: uuid.UUID) -> None:
    await db.execute(
        delete(Follow).where(Follow.community_id == community_id, Follow.user_id == user_id)
    )
    await db.commit()


async def is_following(db: AsyncSession, community_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    result = await db.execute(
        select(Follow.id).where(
            Follow.community_id == community_id, Follow.user_id == user_id
        )
    )
    return result.scalar_one_or_none() is not None


async def count_followers(db: AsyncSession, community_id: uuid.UUID) -> int:
    result = await db.execute(
        select(func.count()).select_from(Follow).where(Follow.community_id == community_id)
    )
    return int(result.scalar() or 0)


async def count_followers_map(
    db: AsyncSession, community_ids: list[uuid.UUID]
) -> dict[uuid.UUID, int]:
    """Follower counts for many communities in one query (for grids)."""
    if not community_ids:
        return {}
    result = await db.execute(
        select(Follow.community_id, func.count())
        .where(Follow.community_id.in_(community_ids))
        .group_by(Follow.community_id)
    )
    return {cid: int(n) for cid, n in result.all()}


async def list_followed_communities(db: AsyncSession, user_id: uuid.UUID) -> list[Community]:
    """Communities the user follows (suspended ones hidden), newest follow first."""
    result = await db.execute(
        select(Community)
        .join(Follow, Follow.community_id == Community.id)
        .where(Follow.user_id == user_id, Community.is_suspended.is_(False))
        .order_by(Follow.created_at.desc())
    )
    return list(result.scalars().all())
