import uuid

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.channel_moderator import ChannelModerator
from models.community import Community


async def get_community(db: AsyncSession, community_id: uuid.UUID) -> Community | None:
    result = await db.execute(select(Community).where(Community.id == community_id))
    return result.scalar_one_or_none()


async def get_community_by_slug(db: AsyncSession, slug: str) -> Community | None:
    result = await db.execute(select(Community).where(Community.slug == slug))
    return result.scalar_one_or_none()


async def list_communities(db: AsyncSession, limit: int = 50, offset: int = 0) -> list[Community]:
    """Public listing — suspended communities are hidden."""
    result = await db.execute(
        select(Community)
        .where(Community.is_suspended.is_(False))
        .order_by(Community.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars().all())


async def list_all_communities(db: AsyncSession) -> list[Community]:
    """Admin listing — includes suspended communities."""
    result = await db.execute(select(Community).order_by(Community.created_at.desc()))
    return list(result.scalars().all())


async def search_communities(
    db: AsyncSession, q: str | None = None, limit: int = 50, offset: int = 0
) -> list[Community]:
    """Public listing with optional name/slug/stream-title search."""
    stmt = select(Community).where(Community.is_suspended.is_(False))
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            or_(
                Community.name.ilike(like),
                Community.slug.ilike(like),
                Community.stream_title.ilike(like),
            )
        )
    result = await db.execute(
        stmt.order_by(Community.created_at.desc()).limit(limit).offset(offset)
    )
    return list(result.scalars().all())


async def list_my_communities(db: AsyncSession, user_id: uuid.UUID) -> list[tuple[Community, str]]:
    """Channels the user owns or moderates, each with their role."""
    owned = await db.execute(
        select(Community)
        .where(Community.owner_id == user_id, Community.is_suspended.is_(False))
        .order_by(Community.created_at.desc())
    )
    moderated = await db.execute(
        select(Community)
        .join(ChannelModerator, ChannelModerator.community_id == Community.id)
        .where(ChannelModerator.user_id == user_id, Community.is_suspended.is_(False))
        .order_by(Community.created_at.desc())
    )
    return [(c, "owner") for c in owned.scalars()] + [(c, "moderator") for c in moderated.scalars()]
