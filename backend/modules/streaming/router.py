"""Streaming routes: public discovery/playback info + streamer/admin controls."""

import time
import uuid

from fastapi import APIRouter, Depends, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.database import get_db
from core.exceptions import ForbiddenException, NotFoundException
from core.security.deps import get_current_user
from core.security.guards import require_admin
from models.user import User
from modules.communities.service.queries import get_community, search_communities
from modules.communities.service.roles import can_moderate
from modules.streaming.schemas import DiscoverItem, LiveStreamOut, StreamHealthOut
from modules.streaming.service import monitor
from modules.streaming.service.discover import build_discover_items
from modules.streaming.service.mediamtx import (
    kick_publisher,
    path_details,
    track_codecs,
    viewer_count,
)
from modules.streaming.service.playback import (
    hls_url,
    is_community_live,
    list_live_community_ids,
    webrtc_url,
)
from modules.streaming.service.thumbs import thumb_path

# ── Public ────────────────────────────────────────────────────────────
router = APIRouter(prefix="/streaming", tags=["streaming"])


@router.get("/discover", response_model=list[DiscoverItem])
async def discover(
    q: str | None = None,
    limit: int = 60,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
) -> list[DiscoverItem]:
    """Public browse grid — live channels first (by viewers), then the rest."""
    communities = await search_communities(db, q, limit=limit, offset=offset)
    items = await build_discover_items(db, communities)
    # Live first, most viewers first; offline keeps created_at desc order.
    items.sort(key=lambda i: (not i.is_live, -i.viewers))
    return items


@router.get("/live")
async def live_streams():
    """Community ids that are currently live, with playback URLs."""
    ids = await list_live_community_ids()
    return {
        "items": [
            {
                "community_id": cid,
                "hls_url": hls_url(cid),
                "webrtc_url": webrtc_url(cid),
            }
            for cid in ids
        ]
    }


@router.get("/communities/{community_id}/status")
async def stream_status(community_id: uuid.UUID):
    cid = str(community_id)
    live = await is_community_live(cid)
    viewers = await viewer_count(cid) if live else 0
    started = await monitor.started_at(cid)
    return {
        "community_id": cid,
        "is_live": live,
        "viewers": viewers,
        "started_at": monitor.iso(started) if started is not None else None,
        "rtmp_ingest_url": f"{settings.rtmp_base_url}/community/{cid}",
        "hls_url": hls_url(cid),
        "webrtc_url": webrtc_url(cid),
    }


@router.get("/communities/{community_id}/thumb", include_in_schema=False)
async def stream_thumbnail(community_id: uuid.UUID):
    """Latest live frame (or the offline poster) as a JPEG.

    Public — browse cards are public. Short cache: thumbnails refresh
    while live. 404 until the first frame of the first stream exists.
    """
    path = thumb_path(str(community_id))
    if not path.exists():
        raise NotFoundException("No thumbnail for this channel yet")
    return FileResponse(
        path,
        media_type="image/jpeg",
        headers={"Cache-Control": "public, max-age=30"},
    )


async def _require_channel_mod(
    community_id: uuid.UUID, current_user: User, db: AsyncSession
) -> None:
    """Raise unless the user owns or moderates this channel (or is system staff)."""
    community = await get_community(db, community_id)
    if community is None:
        raise NotFoundException("Community not found")
    if not await can_moderate(db, community, current_user):
        raise ForbiddenException("Only the channel owner and moderators can see stream health")


@router.get("/communities/{community_id}/health", response_model=StreamHealthOut)
async def stream_health(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreamHealthOut:
    """Streamer dashboard health snapshot (channel owner/admin/mod/streamer)."""
    community = await get_community(db, community_id)
    if community is None:
        raise NotFoundException("Community not found")
    await _require_channel_mod(community_id, current_user, db)
    cid = str(community_id)
    details = await path_details(cid)
    started = await monitor.started_at(cid)
    video, audio = track_codecs(details)
    return StreamHealthOut(
        community_id=cid,
        is_live=details is not None,
        viewers=len((details or {}).get("readers") or []),
        started_at=monitor.iso(started) if started is not None else None,
        uptime_seconds=int(time.time() - started) if started is not None else None,
        video_codec=video,
        audio_codec=audio,
    )


@router.post("/communities/{community_id}/stop", status_code=status.HTTP_204_NO_CONTENT)
async def stop_channel_stream(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Disconnect the active publisher (channel owner/admin/mod/streamer).

    Note: OBS auto-reconnects while the key is valid — rotating the key is the
    hard lockout; this is the instant 'cut the feed' lever.
    """
    community = await get_community(db, community_id)
    if community is None:
        raise NotFoundException("Community not found")
    await _require_channel_mod(community_id, current_user, db)
    await kick_publisher(str(community_id))


@router.get("/playbook")
async def streaming_playbook(current_user: User = Depends(get_current_user)):
    """Instructions for going live with OBS (shown in the UI)."""
    return {
        "ingest_server": settings.rtmp_base_url,
        "path_format": "community/<community_id>",
        "steps": [
            "Open OBS → Settings → Stream",
            "Service: Custom",
            f"Server: {settings.rtmp_base_url}/community/<your-community-id>",
            "Start streaming — status flips to live within a few seconds",
        ],
    }


# ── Admin ─────────────────────────────────────────────────────────────
admin_router = APIRouter(
    prefix="/admin",
    tags=["admin-streaming"],
    dependencies=[Depends(require_admin)],
)


@admin_router.get("/live", response_model=list[LiveStreamOut])
async def list_live(
    db: AsyncSession = Depends(get_db),
) -> list[LiveStreamOut]:
    out: list[LiveStreamOut] = []
    for cid in await list_live_community_ids():
        c = await get_community(db, uuid.UUID(cid))
        if c is None:
            continue
        out.append(LiveStreamOut(community_id=cid, name=c.name, viewers=await viewer_count(cid)))
    return out


@admin_router.post("/communities/{community_id}/stop", status_code=status.HTTP_204_NO_CONTENT)
async def stop_stream(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> None:
    c = await get_community(db, community_id)
    if c is None:
        raise NotFoundException("Community not found")
    await kick_publisher(str(community_id))
