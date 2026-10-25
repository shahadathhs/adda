"""Message reactions: a fixed emoji set, toggled per account, counted and fanned out in batches."""

import asyncio
import contextlib
import logging
import uuid

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import async_session_factory
from models.message import Message
from models.message_reaction import MessageReaction
from modules.chat.service.messages import MessageRejected
from modules.realtime.manager import manager
from modules.realtime.protocol import outgoing

log = logging.getLogger("adda.reactions")

ALLOWED = ("👍", "❤️", "😂", "😮", "🎉", "👏", "🔥", "☕")
MAX_PER_USER_PER_MESSAGE = 5
BATCH_SECONDS = 0.25


async def toggle(
    db: AsyncSession, message: Message, user_id: uuid.UUID, emoji: str, on: bool
) -> dict[str, int]:
    """Add or remove one reaction; returns the message's counts."""
    if emoji not in ALLOWED:
        raise MessageRejected("bad_emoji", "That reaction is not available")
    if message.deleted_at is not None:
        raise MessageRejected("not_found", "Message not found")

    existing = (
        await db.execute(
            select(MessageReaction).where(
                MessageReaction.message_id == message.id,
                MessageReaction.user_id == user_id,
                MessageReaction.emoji == emoji,
            )
        )
    ).scalar_one_or_none()

    if on and existing is None:
        have = (
            await db.execute(
                select(func.count())
                .select_from(MessageReaction)
                .where(MessageReaction.message_id == message.id, MessageReaction.user_id == user_id)
            )
        ).scalar() or 0
        if have >= MAX_PER_USER_PER_MESSAGE:
            raise MessageRejected(
                "too_many_reactions", f"At most {MAX_PER_USER_PER_MESSAGE} reactions per message"
            )
        db.add(MessageReaction(message_id=message.id, user_id=user_id, emoji=emoji))
        await db.commit()
    elif not on and existing is not None:
        await db.execute(delete(MessageReaction).where(MessageReaction.id == existing.id))
        await db.commit()
    return await counts(db, message.id)


async def counts(db: AsyncSession, message_id: uuid.UUID) -> dict[str, int]:
    rows = await db.execute(
        select(MessageReaction.emoji, func.count())
        .where(MessageReaction.message_id == message_id)
        .group_by(MessageReaction.emoji)
    )
    return {emoji: int(n) for emoji, n in rows.all()}


class ReactionBatcher:
    """Coalesces reaction changes so a busy message sends at most one update per 250 ms."""

    def __init__(self) -> None:
        self._dirty: dict[str, set[uuid.UUID]] = {}
        self._tasks: dict[str, asyncio.Task[None]] = {}

    def mark(self, channel: str, message_id: uuid.UUID) -> None:
        self._dirty.setdefault(channel, set()).add(message_id)
        task = self._tasks.get(channel)
        if task is None or task.done():
            self._tasks[channel] = asyncio.create_task(self._flush(channel))

    async def _flush(self, channel: str) -> None:
        await asyncio.sleep(BATCH_SECONDS)
        ids = self._dirty.pop(channel, set())
        try:
            async with async_session_factory() as db:
                for message_id in ids:
                    await manager.broadcast(
                        channel,
                        outgoing(
                            "reaction_update",
                            channel,
                            {"message_id": str(message_id), "counts": await counts(db, message_id)},
                        ),
                    )
        except Exception:
            log.exception("reaction flush failed")

    async def stop(self) -> None:
        for task in self._tasks.values():
            task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await task
        self._tasks.clear()


batcher = ReactionBatcher()
