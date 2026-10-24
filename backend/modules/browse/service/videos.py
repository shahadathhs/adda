"""Video browsing: public, ready uploads; search, filter by channel, sort, paginate."""

from typing import Literal

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.community import Community
from models.video import Video, VideoStatus, VideoVisibility
from modules.videos.schemas import VideoOut
from modules.videos.service.queries import serialize

VideoSort = Literal["newest", "oldest", "longest", "largest"]

_ORDER = {
    "newest": lambda: Video.created_at.desc(),
    "oldest": lambda: Video.created_at.asc(),
    "longest": lambda: Video.duration_seconds.desc().nulls_last(),
    "largest": lambda: Video.size_bytes.desc(),
}


def _listed(q: str | None, channel: str | None):
    stmt = (
        select(Video, Community)
        .join(Community, Community.id == Video.community_id)
        .where(
            Video.status == VideoStatus.READY,
            Video.visibility == VideoVisibility.PUBLIC,
            Community.is_suspended.is_(False),
            Community.is_private.is_(False),
        )
    )
    if channel:
        stmt = stmt.where(Community.slug == channel)
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Video.title.ilike(like),
                Video.description.ilike(like),
                Community.name.ilike(like),
                Community.slug.ilike(like),
            )
        )
    return stmt


async def browse_videos(
    db: AsyncSession,
    q: str | None,
    channel: str | None,
    sort: VideoSort,
    page: int,
    page_size: int,
) -> tuple[list[VideoOut], int]:
    base = _listed(q, channel)
    total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
    rows = (
        await db.execute(
            base.order_by(_ORDER[sort](), Video.id).limit(page_size).offset((page - 1) * page_size)
        )
    ).all()
    return [serialize(v, c) for v, c in rows], total
