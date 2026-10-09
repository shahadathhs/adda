"""Live stream thumbnail worker.

While a community is live, a per-community task grabs a frame from the
HLS stream with ffmpeg every THUMB_INTERVAL seconds and overwrites
`<thumbs_dir>/<community_id>.jpg` atomically. The last frame stays on
disk after the stream ends and serves as the offline poster.

Public surface: `sync(live_ids)` (idempotent start/stop) and
`thumb_path(community_id)` for the serving endpoint.
"""

import asyncio
import logging
import os
import tempfile
from pathlib import Path

from core.config import settings
from modules.streaming.service.mediamtx import community_path

log = logging.getLogger("adda.thumbs")

THUMB_INTERVAL = 20
FFMPEG_TIMEOUT = 30

_tasks: dict[str, asyncio.Task[None]] = {}


def thumb_path(community_id: str) -> Path:
    return Path(settings.thumbs_dir) / f"{community_id}.jpg"


def _hls_input(community_id: str) -> str:
    return f"{settings.mtx_hls_url}/{community_path(community_id)}/index.m3u8"


async def _capture_once(community_id: str) -> bool:
    """One ffmpeg frame grab; True on success."""
    thumb = thumb_path(community_id)
    thumb.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(suffix=".jpg", dir=thumb.parent)
    os.close(fd)
    try:
        proc = await asyncio.create_subprocess_exec(
            "ffmpeg",
            "-y",
            "-loglevel",
            "error",
            "-nostdin",
            "-rw_timeout",
            str(FFMPEG_TIMEOUT * 1_000_000),
            "-i",
            _hls_input(community_id),
            "-frames:v",
            "1",
            "-q:v",
            "3",
            tmp,
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.DEVNULL,
        )
        try:
            await asyncio.wait_for(proc.wait(), timeout=FFMPEG_TIMEOUT)
        except TimeoutError:
            proc.kill()
            return False
        if proc.returncode != 0 or not os.path.getsize(tmp):
            return False
        os.replace(tmp, thumb)  # atomic — readers never see a partial file
        return True
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


async def _loop(community_id: str) -> None:
    while True:
        try:
            await _capture_once(community_id)
        except FileNotFoundError:
            log.error("ffmpeg not found — thumbnails disabled (install ffmpeg)")
            return
        except Exception:
            log.exception("thumbnail capture failed for community %s", community_id)
        await asyncio.sleep(THUMB_INTERVAL)


def sync(live_ids: set[str] | list[str]) -> None:
    """Start capture for every live id, stop for the rest. Idempotent."""
    live = {str(cid) for cid in live_ids}

    for cid in live - _tasks.keys():
        _tasks[cid] = asyncio.create_task(_loop(cid))
        log.info("thumbnail capture started for community %s", cid)

    for cid in list(_tasks.keys() - live):
        _tasks.pop(cid).cancel()
        log.info("thumbnail capture stopped for community %s (poster kept)", cid)
