"""Chat REST: message history and moderation deletes. Live delivery is the WebSocket gateway."""

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.exceptions import ForbiddenException, NotFoundException
from core.security.deps import get_current_user, get_optional_user
from models.message import Message
from models.user import User
from modules.chat.schemas import AuthorOut, IdentityModeIn, MessageOut
from modules.chat.service import identity, messages
from modules.chat.service.serialize import serialize
from modules.communities.service.queries import get_community
from modules.communities.service.roles import can_moderate
from modules.users.schemas import UserOut

router = APIRouter(prefix="/communities/{community_id}/messages", tags=["chat"])


@router.get("", response_model=list[MessageOut])
async def history(
    community_id: uuid.UUID,
    before: uuid.UUID | None = Query(None, description="Return messages older than this id"),
    after: uuid.UUID | None = Query(None, description="Return messages newer than this id"),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
):
    """Public: anyone can read a channel's chat. Newest first."""
    community = await get_community(db, community_id)
    if community is None:
        raise NotFoundException("Community not found")
    rows = await messages.list_messages(db, community_id, before=before, limit=limit, after=after)
    return await serialize(db, community, rows, viewer_id=viewer.id if viewer else None)


@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
    community_id: uuid.UUID,
    message_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Authors delete their own messages; owner, moderators and staff delete any."""
    community = await get_community(db, community_id)
    if community is None:
        raise NotFoundException("Community not found")
    message = await db.get(Message, message_id)
    if message is None or message.community_id != community_id or message.deleted_at is not None:
        raise NotFoundException("Message not found")
    if message.user_id != current_user.id and not await can_moderate(db, community, current_user):
        raise ForbiddenException("You can only delete your own messages")
    await messages.delete_message(db, community, message, current_user)


# ── Identity ──────────────────────────────────────────────────────────
identity_router = APIRouter(tags=["chat"])


@identity_router.put("/me/identity-mode", response_model=UserOut)
async def set_identity_mode(
    data: IdentityModeIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Choose how you appear in chat. Applies to messages sent from now on."""
    return await identity.set_identity_mode(db, current_user, data.mode)


@identity_router.get("/chat/messages/{message_id}/author", response_model=AuthorOut)
async def reveal_author(
    message_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Who is behind a message. Owner, moderators and staff only; every call is audited."""
    message = await db.get(Message, message_id)
    if message is None:
        raise NotFoundException("Message not found")
    community = await get_community(db, message.community_id)
    if community is None or not await can_moderate(db, community, current_user):
        raise ForbiddenException("Only moderators can see who sent a message")
    author = await db.get(User, message.user_id)
    assert author is not None
    return await identity.reveal_author(db, message, author, current_user)
