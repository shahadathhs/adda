"""Channel page content: announcements and the banner image."""

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.database import get_db
from core.exceptions import BadRequestException, ForbiddenException, NotFoundException
from core.images import sniff_image
from core.security.deps import get_current_user
from models.announcement import Announcement
from models.community import Community
from models.user import SystemRole, User
from modules.communities.schemas import CommunityOut
from modules.communities.service.queries import get_community

router = APIRouter(tags=["channel-page"])

BANNER_MAX_BYTES = 2 * 1024 * 1024
BANNER_MAX_PIXELS = 4000
BANNER_TYPES = {"png", "jpg", "webp"}
_BANNER_KEY = r"^[0-9a-f]{32}\.(png|jpg|webp)$"


class AnnouncementIn(BaseModel):
    body: str = Field(min_length=1, max_length=500)
    pinned: bool = False


class AnnouncementOut(BaseModel):
    id: uuid.UUID
    body: str
    pinned: bool
    created_at: str


def _out(a: Announcement) -> AnnouncementOut:
    return AnnouncementOut(
        id=a.id, body=a.body, pinned=a.pinned, created_at=a.created_at.isoformat()
    )


async def _owned(db: AsyncSession, community_id: uuid.UUID, user: User) -> Community:
    community = await get_community(db, community_id)
    if community is None:
        raise NotFoundException("Community not found")
    if community.owner_id != user.id and user.system_role not in SystemRole.STAFF:
        raise ForbiddenException("Only the channel owner can edit the channel page")
    return community


# ── Announcements ─────────────────────────────────────────────────────
@router.get("/communities/{community_id}/announcements", response_model=list[AnnouncementOut])
async def list_announcements(
    community_id: uuid.UUID, db: AsyncSession = Depends(get_db)
) -> list[AnnouncementOut]:
    """Public. Pinned posts first, then newest first."""
    if await get_community(db, community_id) is None:
        raise NotFoundException("Community not found")
    rows = (
        (
            await db.execute(
                select(Announcement)
                .where(Announcement.community_id == community_id)
                .order_by(Announcement.pinned.desc(), Announcement.created_at.desc())
                .limit(50)
            )
        )
        .scalars()
        .all()
    )
    return [_out(a) for a in rows]


@router.post(
    "/communities/{community_id}/announcements",
    response_model=AnnouncementOut,
    status_code=status.HTTP_201_CREATED,
)
async def post_announcement(
    community_id: uuid.UUID,
    body: AnnouncementIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AnnouncementOut:
    await _owned(db, community_id, current_user)
    row = Announcement(
        community_id=community_id,
        body=body.body.strip(),
        pinned=body.pinned,
        created_by_id=current_user.id,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return _out(row)


@router.delete(
    "/communities/{community_id}/announcements/{announcement_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_announcement(
    community_id: uuid.UUID,
    announcement_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    await _owned(db, community_id, current_user)
    row = await db.get(Announcement, announcement_id)
    if row is None or row.community_id != community_id:
        raise NotFoundException("Announcement not found")
    await db.delete(row)
    await db.commit()


# ── Banner ────────────────────────────────────────────────────────────
def banners_dir() -> Path:
    path = Path(settings.uploads_dir) / "banners"
    path.mkdir(parents=True, exist_ok=True)
    return path


@router.post("/communities/{community_id}/banner", response_model=CommunityOut)
async def upload_banner(
    community_id: uuid.UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CommunityOut:
    from modules.communities.router import _serialize

    community = await _owned(db, community_id, current_user)
    data = await file.read(BANNER_MAX_BYTES + 1)
    if len(data) > BANNER_MAX_BYTES:
        raise BadRequestException("The banner can be at most 2 MB")
    info = sniff_image(data)
    if info is None or info.ext not in BANNER_TYPES:
        raise BadRequestException("The banner must be a PNG, JPEG or WebP image")
    if info.width > BANNER_MAX_PIXELS or info.height > BANNER_MAX_PIXELS:
        raise BadRequestException("The banner can be at most 4000 pixels on a side")

    key = f"{uuid.uuid4().hex}.{info.ext}"
    (banners_dir() / key).write_bytes(data)
    _drop_banner_file(community)
    community.banner_url = f"{settings.api_prefix}/banners/{community.id}/{key}"
    await db.commit()
    await db.refresh(community)
    return await _serialize(db, community)


@router.delete("/communities/{community_id}/banner", response_model=CommunityOut)
async def remove_banner(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CommunityOut:
    from modules.communities.router import _serialize

    community = await _owned(db, community_id, current_user)
    _drop_banner_file(community)
    community.banner_url = None
    await db.commit()
    await db.refresh(community)
    return await _serialize(db, community)


def _drop_banner_file(community: Community) -> None:
    """Delete the stored banner if the current one is ours (not an external URL)."""
    url = community.banner_url or ""
    prefix = f"{settings.api_prefix}/banners/{community.id}/"
    if url.startswith(prefix):
        (banners_dir() / url.removeprefix(prefix)).unlink(missing_ok=True)


@router.get("/banners/{community_id}/{file_key}")
async def banner_file(community_id: uuid.UUID, file_key: str) -> FileResponse:
    import re

    if not re.match(_BANNER_KEY, file_key):
        raise NotFoundException("Banner not found")
    path = banners_dir() / file_key
    if not path.is_file():
        raise NotFoundException("Banner not found")
    media = {"png": "image/png", "jpg": "image/jpeg", "webp": "image/webp"}
    return FileResponse(
        path,
        media_type=media[file_key.rsplit(".", 1)[1]],
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )
