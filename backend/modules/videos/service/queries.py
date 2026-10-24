"""Reading videos: who may see which, and the serialised form."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from models.community import Community
from models.user import SystemRole, User
from models.video import Video, VideoStatus, VideoVisibility
from modules.videos.schemas import VideoOut


def can_manage(user: User | None, community: Community) -> bool:
    """The channel owner and platform staff manage a channel's videos."""
    return user is not None and (
        community.owner_id == user.id or user.system_role in SystemRole.STAFF
    )


def can_watch(video: Video, user: User | None, community: Community) -> bool:
    if can_manage(user, community):
        return True
    return video.status == VideoStatus.READY and video.visibility != VideoVisibility.PRIVATE


def serialize(video: Video, community: Community) -> VideoOut:
    ready = video.status == VideoStatus.READY
    base = f"{settings.api_prefix}/videos/{video.id}"
    return VideoOut(
        id=video.id,
        community_id=video.community_id,
        community_name=community.name,
        community_slug=community.slug,
        title=video.title,
        description=video.description,
        status=video.status,
        visibility=video.visibility,
        size_bytes=video.size_bytes,
        received_bytes=video.received_bytes,
        duration_seconds=video.duration_seconds,
        width=video.width,
        height=video.height,
        error=video.error,
        created_at=video.created_at,
        poster_url=f"{base}/poster" if ready else None,
        file_url=f"{base}/file" if ready else None,
    )


async def get_video(db: AsyncSession, video_id: uuid.UUID) -> tuple[Video, Community] | None:
    row = (
        await db.execute(
            select(Video, Community)
            .join(Community, Community.id == Video.community_id)
            .where(Video.id == video_id, Community.is_suspended.is_(False))
        )
    ).first()
    return (row[0], row[1]) if row else None


async def list_channel_videos(
    db: AsyncSession, community: Community, user: User | None
) -> list[VideoOut]:
    stmt = select(Video).where(Video.community_id == community.id)
    if not can_manage(user, community):
        stmt = stmt.where(
            Video.status == VideoStatus.READY, Video.visibility == VideoVisibility.PUBLIC
        )
    videos = (await db.execute(stmt.order_by(Video.created_at.desc()).limit(200))).scalars().all()
    return [serialize(v, community) for v in videos]
