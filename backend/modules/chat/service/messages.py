"""Chat messages: send, history, delete. One chat per channel (community)."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.message import Message
from models.user import User

MAX_LENGTH = 300


class MessageRejected(Exception):
    """Raised when a message cannot be sent; `code` is sent to the client."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


def clean_content(raw: object) -> str:
    """Trim, strip control characters, and enforce the length limit."""
    text = "".join(ch for ch in str(raw) if ch == "\n" or (ch >= " " and ch != "\x7f")).strip()
    if not text:
        raise MessageRejected("empty", "Message is empty")
    if len(text) > MAX_LENGTH:
        raise MessageRejected("too_long", f"Messages are limited to {MAX_LENGTH} characters")
    return text


async def create_message(
    db: AsyncSession,
    community_id: uuid.UUID,
    user: User,
    content: object,
    reply_to: object = None,
) -> Message:
    """Persist a message. A reply target from another channel is ignored."""
    text = clean_content(content)

    reply_to_id: uuid.UUID | None = None
    if reply_to:
        try:
            candidate = uuid.UUID(str(reply_to))
        except ValueError:
            candidate = None
        if candidate is not None:
            parent = await db.get(Message, candidate)
            if parent is not None and parent.community_id == community_id:
                reply_to_id = parent.id

    row = Message(community_id=community_id, user_id=user.id, content=text, reply_to_id=reply_to_id)
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


async def list_messages(
    db: AsyncSession,
    community_id: uuid.UUID,
    before: uuid.UUID | None = None,
    limit: int = 50,
) -> list[tuple[Message, User]]:
    """Newest-first page of undeleted messages. `before` is a message id (cursor)."""
    stmt = (
        select(Message, User)
        .join(User, Message.user_id == User.id)
        .where(Message.community_id == community_id, Message.deleted_at.is_(None))
    )
    if before is not None:
        cursor = await db.get(Message, before)
        if cursor is not None:
            stmt = stmt.where(
                or_(
                    Message.created_at < cursor.created_at,
                    and_(Message.created_at == cursor.created_at, Message.id < cursor.id),
                )
            )
    stmt = stmt.order_by(Message.created_at.desc(), Message.id.desc()).limit(limit)
    return [(m, u) for m, u in (await db.execute(stmt)).all()]


async def soft_delete(db: AsyncSession, message: Message, by: User) -> None:
    message.deleted_at = datetime.now(UTC)
    message.deleted_by_id = by.id
    await db.commit()


def wire_payload(message: Message, user: User, channel: str) -> dict:
    """The `chat_message` payload broadcast to subscribers."""
    return {
        "id": str(message.id),
        "channel": channel,
        "community_id": str(message.community_id),
        "user_id": str(user.id),
        "username": user.username,
        "display_name": user.display_name,
        "content": message.content,
        "created_at": message.created_at.isoformat(),
        "reply_to": str(message.reply_to_id) if message.reply_to_id else None,
    }
