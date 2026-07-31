import uuid

from fastapi import APIRouter, Depends

from auth.deps import get_current_user
from models.user import User
from streaming.service import hls_url, is_community_live, list_live_community_ids, webrtc_url

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
        "rtmp_ingest_url": f"rtmp://localhost:1935/community/{community_id}",
        "hls_url": hls_url(str(community_id)),
        "webrtc_url": webrtc_url(str(community_id)),
    }


@router.get("/playbook")
async def streaming_playbook(current_user: User = Depends(get_current_user)):
    """Instructions for going live with OBS (shown in the UI)."""
    return {
        "ingest_server": "rtmp://localhost:1935",
        "path_format": "community/<community_id>",
        "steps": [
            "Open OBS → Settings → Stream",
            "Service: Custom",
            f"Server: rtmp://localhost:1935/community/<your-community-id>",
            "Start streaming — status flips to live within a few seconds",
        ],
    }
