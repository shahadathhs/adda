"""The signed-in user's own profile extras: avatar upload and status."""

import re
import uuid
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, model_validator
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.database import get_db
from core.exceptions import BadRequestException, NotFoundException
from core.images import sniff_image
from core.security.deps import get_current_user
from models.user import User
from modules.users.schemas import UserOut

router = APIRouter(tags=["profile"])

AVATAR_MAX_BYTES = 2 * 1024 * 1024
AVATAR_MAX_PIXELS = 2000
AVATAR_TYPES = {"png", "jpg", "webp"}
_AVATAR_KEY = r"^[0-9a-f]{32}\.(png|jpg|webp)$"
_MEDIA = {"png": "image/png", "jpg": "image/jpeg", "webp": "image/webp"}


# ── Avatar ────────────────────────────────────────────────────────────
def avatars_dir() -> Path:
    path = Path(settings.uploads_dir) / "avatars"
    path.mkdir(parents=True, exist_ok=True)
    return path


def _drop_avatar_file(user: User) -> None:
    """Delete the stored avatar if the current one is ours (not an external URL)."""
    prefix = f"{settings.api_prefix}/avatars/{user.id}/"
    url = user.avatar_url or ""
    if url.startswith(prefix):
        (avatars_dir() / url.removeprefix(prefix)).unlink(missing_ok=True)


@router.post("/auth/me/avatar", response_model=UserOut)
async def upload_avatar(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    data = await file.read(AVATAR_MAX_BYTES + 1)
    if len(data) > AVATAR_MAX_BYTES:
        raise BadRequestException("The picture can be at most 2 MB")
    info = sniff_image(data)
    if info is None or info.ext not in AVATAR_TYPES:
        raise BadRequestException("The picture must be a PNG, JPEG or WebP image")
    if info.width > AVATAR_MAX_PIXELS or info.height > AVATAR_MAX_PIXELS:
        raise BadRequestException("The picture can be at most 2000 pixels on a side")

    key = f"{uuid.uuid4().hex}.{info.ext}"
    (avatars_dir() / key).write_bytes(data)
    _drop_avatar_file(current_user)
    current_user.avatar_url = f"{settings.api_prefix}/avatars/{current_user.id}/{key}"
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.delete("/auth/me/avatar", response_model=UserOut)
async def remove_avatar(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    _drop_avatar_file(current_user)
    current_user.avatar_url = None
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.get("/avatars/{user_id}/{file_key}")
async def avatar_file(user_id: uuid.UUID, file_key: str) -> FileResponse:
    path = avatars_dir() / file_key
    if not re.match(_AVATAR_KEY, file_key) or not path.is_file():
        raise NotFoundException("Picture not found")
    return FileResponse(
        path,
        media_type=_MEDIA[file_key.rsplit(".", 1)[1]],
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )


# ── Status ────────────────────────────────────────────────────────────
class StatusIn(BaseModel):
    emoji: str | None = Field(default=None, max_length=16)
    text: str = Field(default="", max_length=80)
    # How long the status lasts; "never" keeps it until it is cleared.
    expires: Literal["never", "hour", "today", "week"] = "never"

    @model_validator(mode="after")
    def _not_empty(self) -> "StatusIn":
        self.emoji = (self.emoji or "").strip() or None
        self.text = self.text.strip()
        if not self.emoji and not self.text:
            raise ValueError("Add an emoji or a few words, or clear the status")
        return self


def _expiry(choice: str) -> datetime | None:
    now = datetime.now(UTC)
    if choice == "hour":
        return now + timedelta(hours=1)
    if choice == "week":
        return now + timedelta(days=7)
    if choice == "today":
        return (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return None


@router.put("/auth/me/status", response_model=UserOut)
async def set_status(
    data: StatusIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    current_user.status_emoji = data.emoji
    current_user.status_text = data.text or None
    current_user.status_expires_at = _expiry(data.expires)
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.delete("/auth/me/status", response_model=UserOut)
async def clear_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    current_user.status_emoji = None
    current_user.status_text = None
    current_user.status_expires_at = None
    await db.commit()
    await db.refresh(current_user)
    return current_user
