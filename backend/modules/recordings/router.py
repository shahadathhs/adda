"""Recording routes: public list/play + admin list/delete."""

import uuid

from fastapi import APIRouter, Depends, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.exceptions import BadRequestException, NotFoundException
from core.security.guards import require_admin
from models.community import Community
from modules.recordings.schemas import RecordingFeedItem, RecordingOut
from modules.recordings.service.files import delete_recording, resolve_recording, scan_recordings

# ── Public ────────────────────────────────────────────────────────────
router = APIRouter(prefix="/recordings", tags=["recordings"])


@router.get("", response_model=list[RecordingOut])
async def list_recordings(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> list[RecordingOut]:
    exists = (
        await db.execute(select(Community.id).where(Community.id == community_id))
    ).scalar_one_or_none()
    if exists is None:
        raise NotFoundException("Community not found")
    return [RecordingOut(**r) for r in scan_recordings(str(community_id))]


@router.get("/recent", response_model=list[RecordingFeedItem])
async def recent_recordings(
    limit: int = 12,
    db: AsyncSession = Depends(get_db),
) -> list[RecordingFeedItem]:
    """Public home-page feed: newest recordings across PUBLIC channels.

    Private-channel recordings never appear here. Playback goes through
    the (already public) /recordings/file endpoint.
    """
    communities = (
        (
            await db.execute(
                select(Community).where(Community.is_private == False)  # noqa: E712
            )
        )
        .scalars()
        .all()
    )
    by_id = {str(c.id): c for c in communities}

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
    items.sort(key=lambda i: i.created_at, reverse=True)
    return items[:max(1, min(limit, 48))]


@router.get("/file")
async def serve_recording(path: str) -> FileResponse:
    full = resolve_recording(path)
    if full is None:
        raise NotFoundException("Recording not found")
    return FileResponse(full, media_type="video/mp4")


# ── Admin ─────────────────────────────────────────────────────────────
admin_router = APIRouter(
    prefix="/admin/recordings",
    tags=["admin-recordings"],
    dependencies=[Depends(require_admin)],
)


@admin_router.get("", response_model=list[RecordingOut])
@admin_router.get("/", response_model=list[RecordingOut], include_in_schema=False)
async def list_recordings_admin(
    community_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
) -> list[RecordingOut]:
    if community_id is not None:
        recs = scan_recordings(str(community_id))
    else:
        ids = {str(i) for i in (await db.execute(select(Community.id))).scalars().all()}
        recs = scan_recordings(None, ids)
    return [RecordingOut(**r) for r in recs]


@admin_router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recording_admin(path: str) -> None:
    if not delete_recording(path):
        raise BadRequestException("Invalid path")
