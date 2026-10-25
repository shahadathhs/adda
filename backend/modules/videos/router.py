"""Uploaded videos: resumable upload for the channel owner, public listing, playback."""

import uuid
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.exceptions import (
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
)
from core.security.deps import get_current_user, get_optional_user
from core.security.jwt import decode_access_token
from models.community import Community
from models.user import User
from models.video import Video, VideoStatus
from modules.communities.service.queries import get_community
from modules.videos.schemas import (
    UploadProgress,
    UploadStarted,
    VideoCreate,
    VideoOut,
    VideoUpdate,
)
from modules.videos.service import uploads
from modules.videos.service.queries import (
    can_manage,
    can_watch,
    get_video,
    list_channel_videos,
    serialize,
)
from modules.videos.service.storage import (
    POSTER,
    append_part,
    part_size,
    remove_video_files,
    videos_root,
)

router = APIRouter(tags=["videos"])


async def _managed_community(db: AsyncSession, community_id: uuid.UUID, user: User) -> Community:
    community = await get_community(db, community_id)
    if community is None:
        raise NotFoundException("Channel not found")
    if not can_manage(user, community):
        raise ForbiddenException("Only the channel owner can upload videos")
    return community


async def _managed_video(
    db: AsyncSession, video_id: uuid.UUID, user: User
) -> tuple[Video, Community]:
    found = await get_video(db, video_id)
    if found is None:
        raise NotFoundException("Video not found")
    if not can_manage(user, found[1]):
        raise ForbiddenException("Only the channel owner can change this video")
    return found


# ── Upload (owner) ────────────────────────────────────────────────────
@router.post(
    "/communities/{community_id}/videos",
    response_model=UploadStarted,
    status_code=status.HTTP_201_CREATED,
)
async def start_upload(
    community_id: uuid.UUID,
    data: VideoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UploadStarted:
    """Create the video and get ready to receive it in parts (`PUT /videos/{id}/chunk`)."""
    community = await _managed_community(db, community_id, current_user)
    if Path(data.filename).suffix.lower() not in uploads.EXTENSIONS:
        raise BadRequestException("Upload an MP4, M4V, MOV or WebM file")
    if data.size_bytes > uploads.MAX_BYTES:
        raise BadRequestException("A video can be at most 4 GB")
    await uploads.purge_stale_uploads(db)
    video = Video(
        community_id=community.id,
        uploader_id=current_user.id,
        title=data.title.strip(),
        description=(data.description or "").strip() or None,
        visibility=data.visibility,
        original_name=Path(data.filename).name[:255],
        size_bytes=data.size_bytes,
    )
    db.add(video)
    await db.commit()
    await db.refresh(video)
    return UploadStarted(
        video=serialize(video, community),
        chunk_size=uploads.CHUNK_SIZE,
        max_chunk_size=uploads.MAX_CHUNK_SIZE,
    )


@router.put("/videos/{video_id}/chunk", response_model=UploadProgress)
async def upload_chunk(
    video_id: uuid.UUID,
    request: Request,
    offset: Annotated[int, Query(ge=0)],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UploadProgress:
    """Append the body at `offset`; a wrong offset is a 409 (see GET /videos/{id})."""
    video, _ = await _managed_video(db, video_id, current_user)
    if video.status != VideoStatus.UPLOADING:
        raise ConflictException("This upload is already finished")
    if int(request.headers.get("content-length") or 0) > uploads.MAX_CHUNK_SIZE:
        raise BadRequestException("That part is too large")
    data = await request.body()
    if not data or len(data) > uploads.MAX_CHUNK_SIZE:
        raise BadRequestException("That part is empty or too large")
    if offset + len(data) > video.size_bytes:
        raise BadRequestException("More data than the size you declared")
    try:
        received = append_part(video.id, offset, data)
    except ValueError:
        have = part_size(video.id)
        video.received_bytes = have
        await db.commit()
        raise ConflictException(f"The server has {have} bytes; resume from there") from None
    video.received_bytes = received
    await db.commit()
    return UploadProgress(received_bytes=received)


@router.post("/videos/{video_id}/complete", response_model=VideoOut)
async def finish_upload(
    video_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> VideoOut:
    """All parts sent: inspect the file and prepare it for playback in the background."""
    video, community = await _managed_video(db, video_id, current_user)
    if video.status != VideoStatus.UPLOADING:
        raise ConflictException("This upload is already finished")
    if part_size(video.id) != video.size_bytes:
        raise BadRequestException("The whole file has not arrived yet")
    video.status = VideoStatus.PROCESSING
    await db.commit()
    uploads.start_processing(video.id)
    await db.refresh(video)
    return serialize(video, community)


# ── Read ──────────────────────────────────────────────────────────────
@router.get("/communities/{community_id}/videos", response_model=list[VideoOut])
async def channel_videos(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
) -> list[VideoOut]:
    """Public, ready videos; the owner also sees uploads in progress, failed and private ones."""
    community = await get_community(db, community_id)
    if community is None:
        raise NotFoundException("Channel not found")
    return await list_channel_videos(db, community, viewer)


@router.get("/videos/{video_id}", response_model=VideoOut)
async def video_detail(
    video_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
) -> VideoOut:
    found = await get_video(db, video_id)
    if found is None or not can_watch(found[0], viewer, found[1]):
        raise NotFoundException("Video not found")
    return serialize(*found)


async def _viewer_for_media(
    db: AsyncSession, header_user: User | None, token: str | None
) -> User | None:
    """A <video> tag cannot send a header, so the file routes also accept `?token=`."""
    if header_user is not None or not token:
        return header_user
    user_id = decode_access_token(token)
    return await db.get(User, uuid.UUID(user_id)) if user_id else None


@router.get("/videos/{video_id}/file")
async def video_file(
    video_id: uuid.UUID,
    token: str | None = None,
    db: AsyncSession = Depends(get_db),
    header_user: User | None = Depends(get_optional_user),
) -> FileResponse:
    found = await get_video(db, video_id)
    viewer = await _viewer_for_media(db, header_user, token)
    if (
        found is None
        or found[0].file_name is None
        or found[0].status != VideoStatus.READY
        or not can_watch(found[0], viewer, found[1])
    ):
        raise NotFoundException("Video not found")
    path = videos_root() / str(video_id) / found[0].file_name
    if not path.is_file():
        raise NotFoundException("Video not found")
    media_type = "video/webm" if path.suffix == ".webm" else "video/mp4"
    return FileResponse(
        path, media_type=media_type, headers={"Cache-Control": "private, max-age=3600"}
    )


@router.get("/videos/{video_id}/poster")
async def video_poster(
    video_id: uuid.UUID,
    token: str | None = None,
    db: AsyncSession = Depends(get_db),
    header_user: User | None = Depends(get_optional_user),
) -> FileResponse:
    found = await get_video(db, video_id)
    viewer = await _viewer_for_media(db, header_user, token)
    if found is None or not can_watch(found[0], viewer, found[1]):
        raise NotFoundException("Poster not found")
    path = videos_root() / str(video_id) / POSTER
    if not path.is_file():
        raise NotFoundException("Poster not found")
    return FileResponse(
        path, media_type="image/jpeg", headers={"Cache-Control": "private, max-age=3600"}
    )


# ── Manage (owner) ────────────────────────────────────────────────────
@router.patch("/videos/{video_id}", response_model=VideoOut)
async def update_video(
    video_id: uuid.UUID,
    data: VideoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> VideoOut:
    video, community = await _managed_video(db, video_id, current_user)
    if data.title is not None:
        video.title = data.title.strip()
    if "description" in data.model_fields_set:
        video.description = (data.description or "").strip() or None
    if data.visibility is not None:
        video.visibility = data.visibility
    await db.commit()
    await db.refresh(video)
    return serialize(video, community)


@router.delete("/videos/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_video(
    video_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete the video and its files, whatever state the upload is in."""
    video, _ = await _managed_video(db, video_id, current_user)
    remove_video_files(video.id)
    await db.delete(video)
    await db.commit()
