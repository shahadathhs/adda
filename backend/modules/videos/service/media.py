"""Inspect and prepare an uploaded file for direct playback (ffmpeg and ffprobe, no transcoding)."""

import asyncio
import json
from dataclasses import dataclass
from pathlib import Path

VIDEO_CODECS = {"h264", "vp8", "vp9", "av1"}
AUDIO_CODECS = {"aac", "mp3", "opus", "vorbis", "flac"}
MP4_FAMILY = {"mov", "mp4", "m4a", "3gp", "3g2", "mj2"}  # ffprobe's format_name pieces


class UnplayableVideo(Exception):
    """The file is not a video a browser can play directly; the message says why."""


@dataclass(frozen=True)
class MediaInfo:
    duration: float
    width: int
    height: int
    video_codec: str
    audio_codec: str | None
    formats: frozenset[str]


async def _run(*cmd: str, timeout: float) -> bytes:
    proc = await asyncio.create_subprocess_exec(
        *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    try:
        out, err = await asyncio.wait_for(proc.communicate(), timeout)
    except TimeoutError:
        proc.kill()
        raise UnplayableVideo("Preparing the video took too long") from None
    if proc.returncode != 0:
        tail = err.decode(errors="replace").strip().splitlines()[-1:] or ["unknown error"]
        raise UnplayableVideo(f"ffmpeg could not read the file: {tail[0][:200]}")
    return out


async def probe(path: Path) -> MediaInfo:
    """What is in the file, read by ffprobe (never from its name)."""
    out = await _run(
        "ffprobe", "-v", "error", "-print_format", "json", "-show_format", "-show_streams",
        str(path), timeout=120,
    )  # fmt: skip
    data = json.loads(out)
    streams = data.get("streams", [])
    video = next((s for s in streams if s.get("codec_type") == "video"), None)
    audio = next((s for s in streams if s.get("codec_type") == "audio"), None)
    if video is None:
        raise UnplayableVideo("The file has no video track")
    duration = float(data.get("format", {}).get("duration") or video.get("duration") or 0)
    return MediaInfo(
        duration=duration,
        width=int(video.get("width") or 0),
        height=int(video.get("height") or 0),
        video_codec=str(video.get("codec_name", "")),
        audio_codec=str(audio.get("codec_name")) if audio else None,
        formats=frozenset(str(data.get("format", {}).get("format_name", "")).split(",")),
    )


def check_playable(info: MediaInfo) -> None:
    """Raise UnplayableVideo unless browsers can play these codecs without re-encoding."""
    if info.duration <= 0:
        raise UnplayableVideo("The video has no length")
    if info.video_codec not in VIDEO_CODECS:
        raise UnplayableVideo(
            f"The video codec ({info.video_codec or 'unknown'}) does not play in browsers. "
            "Re-encode it as H.264 (MP4) or VP9 (WebM) and upload it again."
        )
    if info.audio_codec is not None and info.audio_codec not in AUDIO_CODECS:
        raise UnplayableVideo(
            f"The audio codec ({info.audio_codec}) does not play in browsers. "
            "Re-encode it as AAC or Opus and upload it again."
        )


async def finalize(part: Path, info: MediaInfo, folder: Path) -> str:
    """Move the upload to its playable name. MP4-family files are remuxed (copied, not re-encoded)
    with the index first, so playback starts at once and seeking works. Returns the file name."""
    if info.formats & MP4_FAMILY:
        out = folder / "video.mp4"
        await _run(
            "ffmpeg", "-y", "-v", "error", "-i", str(part), "-c", "copy",
            "-movflags", "+faststart", str(out), timeout=3600,
        )  # fmt: skip
        part.unlink(missing_ok=True)
        return out.name
    out = folder / "video.webm"
    part.replace(out)
    return out.name


async def make_poster(video: Path, duration: float, out: Path) -> None:
    """One frame, a tenth of the way in (at most 10 s), scaled to 640 px wide."""
    at = min(duration * 0.1, 10.0)
    await _run(
        "ffmpeg", "-y", "-v", "error", "-ss", f"{at:.2f}", "-i", str(video),
        "-frames:v", "1", "-vf", "scale=640:-2", "-q:v", "4", str(out), timeout=120,
    )  # fmt: skip
