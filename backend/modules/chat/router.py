"""Chat REST: message history and moderation deletes. Live delivery is the WebSocket gateway."""

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.exceptions import ForbiddenException, NotFoundException
from core.security.deps import get_current_user
from models.message import Message
from models.user import User
from modules.chat.schemas import MessageOut
from modules.chat.service import messages
from modules.communities.service.queries import get_community
from modules.communities.service.roles import can_moderate

router = APIRouter(prefix="/communities/{community_id}/messages", tags=["chat"])


@router.get("", response_model=list[MessageOut])
async def history(
    community_id: uuid.UUID,
    before: uuid.UUID | None = Query(None, description="Return messages older than this id"),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Public: anyone can read a channel's chat. Newest first."""
    if await get_community(db, community_id) is None:
        raise NotFoundException("Community not found")
    return [
        MessageOut(
            id=m.id,
            community_id=m.community_id,
            user_id=u.id,
            username=u.username,
            display_name=u.display_name,
            content=m.content,
            reply_to_id=m.reply_to_id,
            created_at=m.created_at,
        )
        for m, u in await messages.list_messages(db, community_id, before=before, limit=limit)
    ]


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
    await messages.soft_delete(db, message, current_user)
