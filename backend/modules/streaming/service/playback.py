"""Playback helpers: live detection + URL builders (read-only mediamtx queries)."""

from core.config import settings
from modules.streaming.service.mediamtx import community_path, list_paths


async def is_community_live(community_id: str) -> bool:
    """True if a ready source exists for the community's stream path."""
    path = community_path(community_id)
    for item in await list_paths():
        if item.get("name") == path and item.get("ready", False):
            return True
    return False


async def list_live_community_ids() -> list[str]:
    """All community stream paths currently live."""
    ids: list[str] = []
    for item in await list_paths():
        name = item.get("name", "")
        if name.startswith("community/") and item.get("ready", False):
            ids.append(name.removeprefix("community/"))
    return ids


def hls_url(community_id: str) -> str:
    return f"{settings.hls_base_url}/{community_path(community_id)}/index.m3u8"


def webrtc_url(community_id: str) -> str:
    return f"{settings.webrtc_base_url}/{community_path(community_id)}"
