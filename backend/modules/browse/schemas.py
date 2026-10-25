from pydantic import BaseModel

from modules.recordings.schemas import RecordingFeedItem
from modules.streaming.schemas import DiscoverItem
from modules.videos.schemas import VideoOut


class Page[T](BaseModel):
    items: list[T]
    total: int
    page: int
    page_size: int


class SearchOut(BaseModel):
    """Grouped results for the global search box."""

    query: str
    channels: list[DiscoverItem]
    recordings: list[RecordingFeedItem]
    videos: list[VideoOut]


__all__ = ["DiscoverItem", "Page", "RecordingFeedItem", "SearchOut", "VideoOut"]
