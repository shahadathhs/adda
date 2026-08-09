"""Filesystem helpers for mediamtx-written VOD recordings.

Recordings live under <recordings>/community. New layout:
`community/<id>/<file>.mp4`; legacy flat: `community/<id>-<file>.mp4`.
"""

import os
from datetime import UTC, datetime

from core.config import settings


def _base() -> str:
    return os.path.realpath(settings.recordings_dir)


def scan_recordings(community_id: str | None = None, ids: set[str] | None = None) -> list[dict]:
    """List .mp4 recordings under <recordings>/community.

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
                    "created_at": datetime.fromtimestamp(st.st_mtime, tz=UTC),
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


def delete_recording(rel_path: str) -> bool:
    """Delete a recording by relative path. Returns False if it doesn't resolve."""
    full = resolve_recording(rel_path)
    if full is None:
        return False
    os.remove(full)
    return True
