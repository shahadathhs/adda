"""The upload life cycle: create, receive parts, finish, prepare, and clean up."""

import asyncio
import logging
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import async_session_factory
from models.video import Video, VideoStatus
from modules.videos.service import media
from modules.videos.service.storage import PART, POSTER, remove_video_files, video_dir

log = logging.getLogger("adda.videos")

MAX_BYTES = 4 * 1024**3  # 4 GB per video
CHUNK_SIZE = 8 * 1024**2  # what the web app sends per request
MAX_CHUNK_SIZE = 16 * 1024**2  # the most one request may carry
STALE_AFTER = timedelta(hours=24)
EXTENSIONS = {".mp4", ".m4v", ".mov", ".webm"}

_tasks: set[asyncio.Task[None]] = set()


async def purge_stale_uploads(db: AsyncSession) -> None:
    """Drop uploads nobody has touched for a day, and their partial files."""
    cutoff = datetime.now(UTC) - STALE_AFTER
    stale = (
        (
            await db.execute(
                select(Video).where(
                    Video.status == VideoStatus.UPLOADING, Video.updated_at < cutoff
                )
            )
        )
        .scalars()
        .all()
    )
    for video in stale:
        remove_video_files(video.id)
        await db.delete(video)
    if stale:
        await db.commit()


async def process_video(video_id: uuid.UUID) -> None:
    """Inspect the received file and prepare it for playback; ends `ready` or `failed`."""
    async with async_session_factory() as db:
        video = await db.get(Video, video_id)
        if video is None or video.status != VideoStatus.PROCESSING:
            return
        folder = video_dir(video.id)
        try:
            info = await media.probe(folder / PART)
            media.check_playable(info)
            name = await media.finalize(folder / PART, info, folder)
            await media.make_poster(folder / name, info.duration, folder / POSTER)
        except media.UnplayableVideo as e:
            video.status, video.error = VideoStatus.FAILED, str(e)[:300]
            remove_video_files(video.id)
        except Exception:
            log.exception("preparing video %s failed", video.id)
            video.status, video.error = VideoStatus.FAILED, "The video could not be prepared"
            remove_video_files(video.id)
        else:
            video.status, video.error = VideoStatus.READY, None
            video.file_name = name
            video.duration_seconds = info.duration
            video.width, video.height = info.width, info.height
            video.video_codec, video.audio_codec = info.video_codec, info.audio_codec
        await db.commit()


def start_processing(video_id: uuid.UUID) -> None:
    task = asyncio.create_task(process_video(video_id))
    _tasks.add(task)
    task.add_done_callback(_tasks.discard)


async def resume_processing() -> None:
    """After a restart, pick up videos that were being prepared and clean up stale uploads."""
    async with async_session_factory() as db:
        await purge_stale_uploads(db)
        ids = (
            (await db.execute(select(Video.id).where(Video.status == VideoStatus.PROCESSING)))
            .scalars()
            .all()
        )
    for video_id in ids:
        start_processing(video_id)


async def stop() -> None:
    for task in list(_tasks):
        task.cancel()
    await asyncio.gather(*_tasks, return_exceptions=True)
