"""Channel browsing: search, filter by live state, sort, paginate."""

from typing import Literal

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.community import Community
from modules.streaming.schemas import DiscoverItem
from modules.streaming.service.discover import build_discover_items

ChannelStatus = Literal["all", "live", "offline"]
ChannelSort = Literal["viewers", "followers", "newest", "name"]


async def matching_communities(db: AsyncSession, q: str | None) -> list[Community]:
    """Public (not private, not suspended) channels whose name, slug, about or title match."""
    stmt = select(Community).where(
        Community.is_suspended.is_(False), Community.is_private.is_(False)
    )
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Community.name.ilike(like),
                Community.slug.ilike(like),
                Community.description.ilike(like),
                Community.stream_title.ilike(like),
            )
        )
    return list((await db.execute(stmt.order_by(Community.created_at.desc()))).scalars().all())


def _sort(items: list[DiscoverItem], sort: ChannelSort) -> list[DiscoverItem]:
    if sort == "viewers":  # live first, most watched first, then the rest by followers
        return sorted(items, key=lambda i: (not i.is_live, -i.viewers, -i.follower_count))
    if sort == "followers":
        return sorted(items, key=lambda i: (-i.follower_count, i.name.lower()))
    if sort == "name":
        return sorted(items, key=lambda i: i.name.lower())
    return items  # "newest": the query already returns newest first


async def browse_channels(
    db: AsyncSession,
    q: str | None,
    status: ChannelStatus,
    sort: ChannelSort,
    page: int,
    page_size: int,
) -> tuple[list[DiscoverItem], int]:
    """One page of channels and the total that match. Self-hosted scale: filtered in memory."""
    items = await build_discover_items(db, await matching_communities(db, q))
    if status == "live":
        items = [i for i in items if i.is_live]
    elif status == "offline":
        items = [i for i in items if not i.is_live]
    items = _sort(items, sort)
    start = (page - 1) * page_size
    return items[start : start + page_size], len(items)
