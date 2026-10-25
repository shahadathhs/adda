"""Public browse and search: paginated channel and recording lists, and the global search box."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from modules.browse.schemas import DiscoverItem, Page, RecordingFeedItem, SearchOut, VideoOut
from modules.browse.service.channels import (
    ChannelSort,
    ChannelStatus,
    browse_channels,
    matching_communities,
)
from modules.browse.service.recordings import RecordingSort, browse_recordings, search_recordings
from modules.browse.service.videos import VideoSort, browse_videos
from modules.streaming.service.discover import build_discover_items

router = APIRouter(tags=["browse"])

PageNo = Annotated[int, Query(ge=1, le=10_000)]
PageSize = Annotated[int, Query(ge=1, le=48)]
Text = Annotated[str | None, Query(max_length=100)]


@router.get("/browse/channels", response_model=Page[DiscoverItem])
async def channels(
    q: Text = None,
    status: ChannelStatus = "all",
    sort: ChannelSort = "viewers",
    page: PageNo = 1,
    page_size: PageSize = 12,
    db: AsyncSession = Depends(get_db),
) -> Page[DiscoverItem]:
    items, total = await browse_channels(db, q, status, sort, page, page_size)
    return Page(items=items, total=total, page=page, page_size=page_size)


@router.get("/browse/recordings", response_model=Page[RecordingFeedItem])
async def recordings(
    q: Text = None,
    channel: Text = None,
    sort: RecordingSort = "newest",
    page: PageNo = 1,
    page_size: PageSize = 12,
    db: AsyncSession = Depends(get_db),
) -> Page[RecordingFeedItem]:
    items, total = await browse_recordings(db, q, channel, sort, page, page_size)
    return Page(items=items, total=total, page=page, page_size=page_size)


@router.get("/browse/videos", response_model=Page[VideoOut])
async def videos(
    q: Text = None,
    channel: Text = None,
    sort: VideoSort = "newest",
    page: PageNo = 1,
    page_size: PageSize = 12,
    db: AsyncSession = Depends(get_db),
) -> Page[VideoOut]:
    items, total = await browse_videos(db, q, channel, sort, page, page_size)
    return Page(items=items, total=total, page=page, page_size=page_size)


@router.get("/search", response_model=SearchOut)
async def search(
    q: Annotated[str, Query(min_length=1, max_length=100)],
    limit: Annotated[int, Query(ge=1, le=10)] = 5,
    db: AsyncSession = Depends(get_db),
) -> SearchOut:
    """Channels, recordings and videos matching `q`, a few of each, live channels first."""
    found = await build_discover_items(db, await matching_communities(db, q))
    found.sort(key=lambda i: (not i.is_live, -i.viewers, -i.follower_count))
    return SearchOut(
        query=q.strip(),
        channels=found[:limit],
        recordings=(await search_recordings(db, q))[:limit],
        videos=(await browse_videos(db, q, None, "newest", 1, limit))[0],
    )
