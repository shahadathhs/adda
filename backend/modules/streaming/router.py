"""Streaming routes: public discovery/playback info + streamer/admin controls."""

import asyncio
import time
import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.database import get_db
from core.exceptions import ForbiddenException, NotFoundException
from core.security.deps import get_current_user
from core.security.guards import require_admin
from models.membership import CommunityRole
from models.user import SystemRole, User
from modules.communities.service.follows import count_followers_map
from modules.communities.service.queries import (
    count_members_map,
    get_community,
    get_member_role,
    search_communities,
)
from modules.streaming.schemas import DiscoverItem, LiveStreamOut, StreamHealthOut
from modules.streaming.service import monitor
from modules.streaming.service.mediamtx import kick_publisher, path_details, viewer_count
from modules.streaming.service.playback import (
    hls_url,
    is_community_live,
    list_live_community_ids,
    webrtc_url,
)

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
    live_ids = set(await list_live_community_ids())
    viewers_map: dict[str, int] = {}
    if live_ids:
        counts = await asyncio.gather(*(viewer_count(cid) for cid in live_ids))
        viewers_map = dict(zip(live_ids, counts, strict=True))

    communities = await search_communities(db, q, limit=limit, offset=offset)
    ids = [c.id for c in communities]
    members_map = await count_members_map(db, ids)
    followers_map = await count_followers_map(db, ids)

    items = [
        DiscoverItem(
            community_id=str(c.id),
            name=c.name,
            slug=c.slug,
            description=c.description,
            avatar_url=c.avatar_url,
            banner_url=c.banner_url,
            stream_title=c.stream_title,
            is_live=str(c.id) in live_ids,
            viewers=viewers_map.get(str(c.id), 0),
            member_count=members_map.get(c.id, 0),
            follower_count=followers_map.get(c.id, 0),
            hls_url=hls_url(str(c.id)) if str(c.id) in live_ids else None,
            webrtc_url=webrtc_url(str(c.id)) if str(c.id) in live_ids else None,
        )
        for c in communities
    ]
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
    if current_user.system_role not in SystemRole.STAFF:
        role = await get_member_role(db, community_id, current_user.id)
        allowed = {
            CommunityRole.owner,
            CommunityRole.admin,
            CommunityRole.moderator,
            CommunityRole.streamer,
        }
        if role not in allowed:
            raise ForbiddenException("Only channel moderators and streamers can view stream health")
    cid = str(community_id)
    details = await path_details(cid)
    started = await monitor.started_at(cid)
    tracks = (details or {}).get("tracks") or []
    video = next((t.get("codec") for t in tracks if t.get("type") == "video"), None)
    audio = next((t.get("codec") for t in tracks if t.get("type") == "audio"), None)
    return StreamHealthOut(
        community_id=cid,
        is_live=details is not None,
        viewers=len((details or {}).get("readers") or []),
        started_at=monitor.iso(started) if started is not None else None,
        uptime_seconds=int(time.time() - started) if started is not None else None,
        video_codec=video,
        audio_codec=audio,
    )


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
