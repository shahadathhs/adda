from pydantic import BaseModel


class LiveStreamOut(BaseModel):
    community_id: str
    name: str
    viewers: int


class DiscoverItem(BaseModel):
    """One card in the public browse grid (live channels first)."""

    community_id: str
    name: str
    slug: str
    description: str | None = None
    avatar_url: str | None = None
    banner_url: str | None = None
    stream_title: str | None = None
    is_live: bool = False
    viewers: int = 0
    member_count: int = 0
    follower_count: int = 0
    hls_url: str | None = None
    webrtc_url: str | None = None


class StreamHealthOut(BaseModel):
    """Owner/staff-only live health snapshot for the streamer dashboard."""

    community_id: str
    is_live: bool
    viewers: int = 0
    started_at: str | None = None
    uptime_seconds: int | None = None
    video_codec: str | None = None
    audio_codec: str | None = None
