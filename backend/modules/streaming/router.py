"""Streaming routes: public playback info + admin live-stream controls."""
import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.exceptions import NotFoundException
from core.security.deps import get_current_user
from core.security.guards import require_admin
from core.database import get_db
from models.user import User
from modules.communities.service.queries import get_community
from modules.streaming.schemas import LiveStreamOut
from modules.streaming.service.mediamtx import kick_publisher, viewer_count
from modules.streaming.service.playback import (
    hls_url,
    is_community_live,
    list_live_community_ids,
    webrtc_url,
)

# ── Public ────────────────────────────────────────────────────────────
router = APIRouter(prefix="/streaming", tags=["streaming"])


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
    live = await is_community_live(str(community_id))
    return {
        "community_id": str(community_id),
        "is_live": live,
        "rtmp_ingest_url": f"{settings.rtmp_base_url}/community/{community_id}",
        "hls_url": hls_url(str(community_id)),
        "webrtc_url": webrtc_url(str(community_id)),
    }


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
        out.append(
            LiveStreamOut(
                community_id=cid, name=c.name, viewers=await viewer_count(cid)
            )
        )
    return out


@admin_router.post(
    "/communities/{community_id}/stop", status_code=status.HTTP_204_NO_CONTENT
)
async def stop_stream(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> None:
    c = await get_community(db, community_id)
    if c is None:
        raise NotFoundException("Community not found")
    await kick_publisher(str(community_id))
