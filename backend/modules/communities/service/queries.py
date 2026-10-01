import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.community import Community
from models.membership import CommunityRole, Membership


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


async def count_members(db: AsyncSession, community_id: uuid.UUID) -> int:
    result = await db.execute(
        select(func.count()).select_from(Membership).where(Membership.community_id == community_id)
    )
    return int(result.scalar() or 0)


async def count_members_map(
    db: AsyncSession, community_ids: list[uuid.UUID]
) -> dict[uuid.UUID, int]:
    """Member counts for many communities in one query (for grids)."""
    if not community_ids:
        return {}
    result = await db.execute(
        select(Membership.community_id, func.count())
        .where(Membership.community_id.in_(community_ids))
        .group_by(Membership.community_id)
    )
    return {cid: int(n) for cid, n in result.all()}


async def get_member_role(
    db: AsyncSession, community_id: uuid.UUID, user_id: uuid.UUID
) -> CommunityRole | None:
    result = await db.execute(
        select(Membership.role).where(
            Membership.community_id == community_id, Membership.user_id == user_id
        )
    )
    return result.scalar_one_or_none()
