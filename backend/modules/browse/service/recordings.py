"""Recording browsing across public channels: search, filter by channel, sort, paginate."""

from typing import Literal

from sqlalchemy.ext.asyncio import AsyncSession

from models.community import Community
from modules.browse.service.channels import matching_communities
from modules.recordings.schemas import RecordingFeedItem
from modules.recordings.service.files import scan_recordings

RecordingSort = Literal["newest", "oldest", "largest"]


async def _public_channels(db: AsyncSession) -> dict[str, Community]:
    return {str(c.id): c for c in await matching_communities(db, None)}


def _feed(by_id: dict[str, Community]) -> list[RecordingFeedItem]:
    items: list[RecordingFeedItem] = []
    for cid, community in by_id.items():
        for r in scan_recordings(cid):
            items.append(
                RecordingFeedItem(
                    community_id=cid,
                    name=r["name"],
                    path=r["path"],
                    size_bytes=r["size_bytes"],
                    created_at=r["created_at"],
                    community_name=community.name,
                    community_slug=community.slug,
                )
            )
    return items


async def search_recordings(
    db: AsyncSession,
    q: str | None = None,
    channel: str | None = None,
    sort: RecordingSort = "newest",
) -> list[RecordingFeedItem]:
    """Recordings of public channels. `q` matches the file or channel name; `channel` is a slug."""
    by_id = await _public_channels(db)
    if channel:
        by_id = {k: v for k, v in by_id.items() if v.slug == channel}
    items = _feed(by_id)
    if q:
        needle = q.strip().lower()
        items = [
            i
            for i in items
            if needle in i.name.lower()
            or needle in i.community_name.lower()
            or needle in i.community_slug.lower()
        ]
    if sort == "oldest":
        items.sort(key=lambda i: i.created_at)
    elif sort == "largest":
        items.sort(key=lambda i: -i.size_bytes)
    else:
        items.sort(key=lambda i: i.created_at, reverse=True)
    return items


async def browse_recordings(
    db: AsyncSession,
    q: str | None,
    channel: str | None,
    sort: RecordingSort,
    page: int,
    page_size: int,
) -> tuple[list[RecordingFeedItem], int]:
    items = await search_recordings(db, q, channel, sort)
    start = (page - 1) * page_size
    return items[start : start + page_size], len(items)
