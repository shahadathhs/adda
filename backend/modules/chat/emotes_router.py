"""Emote REST: list, upload (owner), remove (owner), and the public image files."""

import uuid

from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.exceptions import ForbiddenException, NotFoundException
from core.security.deps import get_current_user
from models.user import SystemRole, User
from modules.chat.service import emotes
from modules.communities.service.queries import get_community

router = APIRouter(tags=["emotes"])

_MEDIA = {"png": "image/png", "gif": "image/gif", "webp": "image/webp"}


async def _owned(db: AsyncSession, community_id: uuid.UUID, user: User):
    community = await get_community(db, community_id)
    if community is None:
        raise NotFoundException("Community not found")
    if community.owner_id != user.id and user.system_role not in SystemRole.STAFF:
        raise ForbiddenException("Only the channel owner can manage emotes")
    return community


@router.get("/communities/{community_id}/emotes")
async def list_emotes(community_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> list[dict]:
    if await get_community(db, community_id) is None:
        raise NotFoundException("Community not found")
    return [
        {"name": e.name, "url": emotes.public_url(e), "created_at": e.created_at.isoformat()}
        for e in await emotes.list_emotes(db, community_id)
    ]


@router.post("/communities/{community_id}/emotes", status_code=201)
async def upload_emote(
    community_id: uuid.UUID,
    name: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    community = await _owned(db, community_id, current_user)
    # Read one byte past the limit so an oversize file is rejected without buffering it all.
    data = await file.read(emotes.MAX_BYTES + 1)
    emote = await emotes.add_emote(db, community, current_user, name, data)
    return {"name": emote.name, "url": emotes.public_url(emote)}


@router.delete("/communities/{community_id}/emotes/{name}", status_code=204)
async def delete_emote(
    community_id: uuid.UUID,
    name: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    community = await _owned(db, community_id, current_user)
    if not await emotes.remove_emote(db, community, name):
        raise NotFoundException("Emote not found")


@router.get("/emotes/{community_id}/{file_key}")
async def emote_file(community_id: uuid.UUID, file_key: str) -> FileResponse:
    if not emotes.FILE_KEY.match(file_key):
        raise NotFoundException("Emote not found")
    path = emotes.emotes_dir() / file_key
    if not path.is_file():
        raise NotFoundException("Emote not found")
    return FileResponse(
        path,
        media_type=_MEDIA[file_key.rsplit(".", 1)[1]],
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )
