from datetime import datetime

from pydantic import BaseModel


class RecordingOut(BaseModel):
    community_id: str | None
    name: str
    path: str  # relative to the recordings dir; used as the delete handle
    size_bytes: int
    created_at: datetime


class RecordingFeedItem(BaseModel):
    """One card in the public home-page feed (public channels only)."""

    community_id: str
    name: str
    path: str  # playback handle: /api/recordings/file?path=
    size_bytes: int
    created_at: datetime
    community_name: str
    community_slug: str
