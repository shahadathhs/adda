"""Public recording endpoints: list + play a community's past streams.

Recordings are written by mediamtx to the ./recordings volume (bind-mounted
into the backend). Like the live HLS stream, these are public (community VODs)
so playback works in a plain <video> element without token auth.
"""
import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_db
from models.community import Community
from schemas.admin import RecordingOut

router = APIRouter(prefix="/recordings", tags=["recordings"])


def _base() -> str:
    return os.path.realpath(settings.recordings_dir)


def scan_recordings(
    community_id: str | None = None, ids: set[str] | None = None
) -> list[dict]:
    """List .mp4 recordings under <recordings>/community.

    New layout: community/<id>/<file>.mp4 ; legacy flat: community/<id>-<file>.mp4.
    When `community_id` is given, only that community's files are returned.
    `ids` is used to label files by community when listing all.
    """
    base = _base()
    root = os.path.join(base, "community")
    if not os.path.isdir(root):
        return []
    filter_ids = {community_id} if community_id else (ids or set())

    out: list[dict] = []
    for dirpath, _dirs, files in os.walk(root):
        for fn in files:
            if not fn.endswith(".mp4"):
                continue
            full = os.path.join(dirpath, fn)
            rel = os.path.relpath(full, base)
            cid = next(
                (
                    c
                    for c in filter_ids
                    if rel.startswith(f"community/{c}/") or fn.startswith(f"{c}-")
                ),
                None,
            )
            if community_id is not None and cid is None:
                continue
            st = os.stat(full)
            out.append(
                {
                    "community_id": cid,
                    "name": fn,
                    "path": rel,
                    "size_bytes": st.st_size,
                    "created_at": datetime.fromtimestamp(st.st_mtime, tz=timezone.utc),
                }
            )
    out.sort(key=lambda r: r["created_at"], reverse=True)
    return out


def resolve_recording(rel_path: str) -> str | None:
    """Absolute path if `rel_path` is a real .mp4 inside <recordings>/community,
    else None (guards against path traversal)."""
    base = _base()
    target = os.path.realpath(os.path.join(base, rel_path))
    community_root = os.path.join(base, "community") + os.sep
    if not target.startswith(community_root):
        return None
    if not target.endswith(".mp4"):
        return None
    if not os.path.isfile(target):
        return None
    return target


@router.get("", response_model=list[RecordingOut])
async def list_recordings(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> list[RecordingOut]:
    exists = (
        await db.execute(select(Community.id).where(Community.id == community_id))
    ).scalar_one_or_none()
    if exists is None:
        raise HTTPException(status_code=404, detail="Community not found")
    return [RecordingOut(**r) for r in scan_recordings(str(community_id))]


@router.get("/file")
async def serve_recording(path: str) -> FileResponse:
    full = resolve_recording(path)
    if full is None:
        raise HTTPException(status_code=404, detail="Recording not found")
    return FileResponse(full, media_type="video/mp4")
