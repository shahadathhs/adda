"""Chat messages: send, history, delete. One chat per channel (community)."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from core import metrics
from models.community import Community
from models.message import Message
from models.user import User
from modules.chat.service import limits, mentions
from modules.chat.service.moderation import active_ban, audit
from modules.communities.service.follows import is_following
from modules.communities.service.roles import can_moderate
from modules.notifications.service.notify import notify
from modules.realtime.manager import manager
from modules.realtime.protocol import outgoing

MAX_LENGTH = 300


def chat_channel(community_id: uuid.UUID) -> str:
    """The WebSocket topic for a channel's chat."""
    return f"community/{community_id}/chat"


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


async def send_message(
    db: AsyncSession,
    community: Community,
    user: User,
    content: object,
    reply_to: object = None,
) -> Message:
    """Run every send check in order, persist the message, record mentions, raise notifications.

    Order: banned or timed out, followers-only, slow mode, rate limit, length, duplicate.
    Owners, moderators and staff skip followers-only, slow mode and the rate limit.
    """
    privileged = await can_moderate(db, community, user)

    ban = await active_ban(db, community.id, user.id)
    if ban is not None:
        if ban.expires_at is None:
            raise MessageRejected("banned", "You are banned from this chat")
        raise MessageRejected("timed_out", "You are timed out of this chat for now")

    if (
        community.followers_only
        and not privileged
        and not await is_following(db, community.id, user.id)
    ):
        raise MessageRejected("followers_only", "Only followers can chat right now")

    if community.slow_mode_seconds and not privileged:
        wait = await limits.slow_mode_remaining(community.id, user.id)
        if wait > 0:
            raise MessageRejected("slow_mode", f"Slow mode is on. Wait {wait}s to send again")

    if not privileged and not await limits.take_rate_token(community.id, user.id):
        raise MessageRejected("rate_limited", "You are sending messages too fast")

    text = clean_content(content)

    if await limits.is_duplicate(community.id, user.id, text):
        raise MessageRejected("duplicate", "You just sent that")

    parent: Message | None = None
    if reply_to:
        try:
            candidate = uuid.UUID(str(reply_to))
        except ValueError:
            candidate = None
        if candidate is not None:
            found = await db.get(Message, candidate)
            if found is not None and found.community_id == community.id:
                parent = found

    metrics.CHAT_MESSAGES.inc()
    row = Message(
        community_id=community.id,
        user_id=user.id,
        content=text,
        display_mode=user.identity_mode,
        reply_to_id=parent.id if parent else None,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)

    if community.slow_mode_seconds and not privileged:
        await limits.start_slow_mode(community.id, user.id, community.slow_mode_seconds)

    mentioned = await mentions.resolve(db, mentions.extract(text), exclude=user.id)
    await mentions.store(db, row.id, mentioned)
    await _notify(db, community, user, row, parent, mentioned)
    return row


async def _notify(
    db: AsyncSession,
    community: Community,
    sender: User,
    message: Message,
    parent: Message | None,
    mentioned: list[User],
) -> None:
    """Bell entries for mentions and replies. An anonymous sender stays anonymous in them."""
    who = sender.display_name if sender.identity_mode == "named" else "Anonymous"
    payload = {
        "community_id": str(community.id),
        "community_name": community.name,
        "community_slug": community.slug,
        "message_id": str(message.id),
        "from": who,
        "excerpt": message.content[:120],
    }
    notified: set[uuid.UUID] = set()
    if parent is not None and parent.user_id != sender.id:
        await notify(db, parent.user_id, "reply", payload, community.id)
        notified.add(parent.user_id)
    for user in mentioned:
        if user.id not in notified:
            await notify(db, user.id, "mention", payload, community.id)


async def list_messages(
    db: AsyncSession,
    community_id: uuid.UUID,
    before: uuid.UUID | None = None,
    limit: int = 50,
    after: uuid.UUID | None = None,
) -> list[tuple[Message, User]]:
    """Newest-first page of undeleted messages. `before` and `after` are message ids (cursors);
    `after` returns what was sent since that message, for catching up after a reconnect."""
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
    if after is not None:
        cursor = await db.get(Message, after)
        if cursor is not None:
            stmt = stmt.where(
                or_(
                    Message.created_at > cursor.created_at,
                    and_(Message.created_at == cursor.created_at, Message.id > cursor.id),
                )
            )
    stmt = stmt.order_by(Message.created_at.desc(), Message.id.desc()).limit(limit)
    return [(m, u) for m, u in (await db.execute(stmt)).all()]


async def delete_message(
    db: AsyncSession, community: Community, message: Message, by: User
) -> None:
    """Soft-delete (the row stays for the audit trail), unpin if needed, and tell the room."""
    message.deleted_at = datetime.now(UTC)
    message.deleted_by_id = by.id
    was_pinned = community.pinned_message_id == message.id
    if was_pinned:
        community.pinned_message_id = None
    await db.commit()
    if by.id != message.user_id:
        await audit(
            db, community.id, by.id, "delete", target_user_id=message.user_id, message_id=message.id
        )
    channel = chat_channel(community.id)
    await manager.broadcast(
        channel, outgoing("message_deleted", channel, {"message_id": str(message.id)})
    )
    if was_pinned:
        await manager.broadcast(channel, outgoing("pin_update", channel, {"message": None}))
