"""Custom emotes: validated uploads stored under generated names."""

import re
import uuid
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.exceptions import BadRequestException, ConflictException
from core.images import sniff_image
from models.community import Community
from models.emote import Emote
from models.user import User

MAX_BYTES = 256 * 1024
MAX_PIXELS = 128
MAX_PER_CHANNEL = 50
NAME = re.compile(r"^[a-z0-9_]{2,24}$")
EMOTE_TYPES = {"png", "gif", "webp"}
FILE_KEY = re.compile(r"^[0-9a-f]{32}\.(png|gif|webp)$")


def emotes_dir() -> Path:
    path = Path(settings.uploads_dir) / "emotes"
    path.mkdir(parents=True, exist_ok=True)
    return path


def public_url(emote: Emote) -> str:
    return f"{settings.api_prefix}/emotes/{emote.community_id}/{emote.file_key}"


async def list_emotes(db: AsyncSession, community_id: uuid.UUID) -> list[Emote]:
    result = await db.execute(
        select(Emote).where(Emote.community_id == community_id).order_by(Emote.name)
    )
    return list(result.scalars())


async def add_emote(
    db: AsyncSession, community: Community, actor: User, name: str, data: bytes
) -> Emote:
    name = name.strip().lower().strip(":")
    if not NAME.match(name):
        raise BadRequestException("Emote names are 2 to 24 letters, numbers or underscores")
    if len(data) > MAX_BYTES:
        raise BadRequestException("Emotes can be at most 256 KB")
    info = sniff_image(data)
    if info is None or info.ext not in EMOTE_TYPES:
        raise BadRequestException("Emotes must be PNG, GIF or WebP images")
    if info.width > MAX_PIXELS or info.height > MAX_PIXELS:
        raise BadRequestException("Emotes can be at most 128 x 128 pixels")
    count = (
        await db.execute(
            select(func.count()).select_from(Emote).where(Emote.community_id == community.id)
        )
    ).scalar() or 0
    if count >= MAX_PER_CHANNEL:
        raise BadRequestException(f"A channel can have at most {MAX_PER_CHANNEL} emotes")

    file_key = f"{uuid.uuid4().hex}.{info.ext}"
    emote = Emote(community_id=community.id, name=name, file_key=file_key, created_by_id=actor.id)
    db.add(emote)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictException("This channel already has an emote with that name") from exc
    (emotes_dir() / file_key).write_bytes(data)
    await db.refresh(emote)
    return emote


async def remove_emote(db: AsyncSession, community: Community, name: str) -> bool:
    emote = (
        await db.execute(
            select(Emote).where(Emote.community_id == community.id, Emote.name == name)
        )
    ).scalar_one_or_none()
    if emote is None:
        return False
    await db.delete(emote)
    await db.commit()
    (emotes_dir() / emote.file_key).unlink(missing_ok=True)
    return True
