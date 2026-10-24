"""Uploaded videos on disk: <uploads>/videos/<video id>/{upload.part, video.*, poster.jpg}."""

import shutil
import uuid
from pathlib import Path

from core.config import settings

PART = "upload.part"
POSTER = "poster.jpg"


def videos_root() -> Path:
    path = Path(settings.uploads_dir) / "videos"
    path.mkdir(parents=True, exist_ok=True)
    return path


def video_dir(video_id: uuid.UUID) -> Path:
    path = videos_root() / str(video_id)
    path.mkdir(parents=True, exist_ok=True)
    return path


def remove_video_files(video_id: uuid.UUID) -> None:
    shutil.rmtree(videos_root() / str(video_id), ignore_errors=True)


def append_part(video_id: uuid.UUID, offset: int, data: bytes) -> int:
    """Write `data` at `offset`; returns the new size. A gap or an overlap raises ValueError."""
    part = video_dir(video_id) / PART
    have = part.stat().st_size if part.exists() else 0
    if have != offset:
        raise ValueError(have)
    with part.open("ab") as f:
        f.write(data)
    return have + len(data)


def part_size(video_id: uuid.UUID) -> int:
    part = videos_root() / str(video_id) / PART
    return part.stat().st_size if part.exists() else 0
