"""Polls: one open per channel, one vote per account, live tallies in Redis."""

import asyncio
import contextlib
import logging
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import async_session_factory
from core.exceptions import ConflictException
from core.redis_client import redis_client
from models.community import Community
from models.poll import Poll, PollOption, PollVote
from models.user import User
from modules.chat.service.messages import MessageRejected, chat_channel
from modules.chat.service.moderation import audit
from modules.realtime.manager import manager
from modules.realtime.protocol import outgoing

log = logging.getLogger("adda.polls")

MIN_SECONDS, MAX_SECONDS = 30, 30 * 60
UPDATE_INTERVAL = 0.5  # poll_update goes out at most twice a second


def _key(poll_id: uuid.UUID) -> str:
    return f"adda:poll:{poll_id}"


async def _options(db: AsyncSession, poll_id: uuid.UUID) -> list[PollOption]:
    result = await db.execute(
        select(PollOption).where(PollOption.poll_id == poll_id).order_by(PollOption.position)
    )
    return list(result.scalars())


async def _tally(db: AsyncSession, poll: Poll, options: list[PollOption]) -> dict[uuid.UUID, int]:
    """Votes per option: the stored result once closed, Redis while open (rebuilt from the
    votes table if Redis lost it, e.g. after a restart)."""
    if poll.status != "open":
        return {o.id: o.votes for o in options}
    raw = await redis_client.hgetall(_key(poll.id))
    if not raw:
        rows = (
            await db.execute(select(PollVote.option_id).where(PollVote.poll_id == poll.id))
        ).scalars()
        counts: dict[uuid.UUID, int] = {o.id: 0 for o in options}
        for option_id in rows:
            counts[option_id] = counts.get(option_id, 0) + 1
        if any(counts.values()):
            await redis_client.hset(_key(poll.id), mapping={str(k): v for k, v in counts.items()})
        return counts
    return {o.id: int(raw.get(str(o.id), 0)) for o in options}


async def state(db: AsyncSession, poll: Poll, viewer_id: uuid.UUID | None = None) -> dict[str, Any]:
    options = await _options(db, poll.id)
    tally = await _tally(db, poll, options)
    total = sum(tally.values())
    my_vote = None
    if viewer_id is not None:
        voted = (
            await db.execute(
                select(PollVote.option_id).where(
                    PollVote.poll_id == poll.id, PollVote.user_id == viewer_id
                )
            )
        ).scalar_one_or_none()
        my_vote = str(voted) if voted else None
    return {
        "id": str(poll.id),
        "community_id": str(poll.community_id),
        "question": poll.question,
        "status": poll.status,
        "closes_at": poll.closes_at.isoformat(),
        "total": total,
        "my_vote": my_vote,
        "options": [
            {
                "id": str(o.id),
                "label": o.label,
                "votes": tally[o.id],
                "percent": round(100 * tally[o.id] / total) if total else 0,
            }
            for o in options
        ],
    }


async def current(db: AsyncSession, community_id: uuid.UUID) -> Poll | None:
    """The open poll, or the most recent closed one so results stay visible."""
    await close_expired(db)
    open_poll = (
        await db.execute(
            select(Poll).where(Poll.community_id == community_id, Poll.status == "open")
        )
    ).scalar_one_or_none()
    if open_poll is not None:
        return open_poll
    result = await db.execute(
        select(Poll)
        .where(Poll.community_id == community_id)
        .order_by(Poll.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def create(
    db: AsyncSession,
    community: Community,
    actor: User,
    question: str,
    labels: list[str],
    duration_seconds: int,
) -> Poll:
    question = question.strip()
    labels = [label.strip() for label in labels if label.strip()]
    if not question or len(question) > 200:
        raise MessageRejected("bad_poll", "A poll needs a question of up to 200 characters")
    if not 2 <= len(labels) <= 4 or any(len(label) > 80 for label in labels):
        raise MessageRejected("bad_poll", "A poll has 2 to 4 options of up to 80 characters")
    if not MIN_SECONDS <= duration_seconds <= MAX_SECONDS:
        raise MessageRejected("bad_poll", "A poll runs between 30 seconds and 30 minutes")

    await close_expired(db)
    poll = Poll(
        community_id=community.id,
        question=question,
        created_by_id=actor.id,
        closes_at=datetime.now(UTC) + timedelta(seconds=duration_seconds),
    )
    db.add(poll)
    try:
        await db.flush()
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictException("A poll is already open on this channel") from exc
    for position, label in enumerate(labels):
        db.add(PollOption(poll_id=poll.id, position=position, label=label))
    await db.commit()
    await db.refresh(poll)
    await audit(db, community.id, actor.id, "poll_start", detail=question[:120])
    channel = chat_channel(community.id)
    await manager.broadcast(channel, outgoing("poll_started", channel, await state(db, poll)))
    return poll


async def vote(db: AsyncSession, poll: Poll, user: User, option_id: uuid.UUID) -> None:
    if poll.status != "open" or poll.closes_at <= datetime.now(UTC):
        raise MessageRejected("poll_closed", "This poll has closed")
    option = next((o for o in await _options(db, poll.id) if o.id == option_id), None)
    if option is None:
        raise MessageRejected("bad_option", "That option is not in this poll")
    db.add(PollVote(poll_id=poll.id, user_id=user.id, option_id=option.id))
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise MessageRejected("already_voted", "You already voted in this poll") from exc
    await redis_client.hincrby(_key(poll.id), str(option.id), 1)
    schedule_update(poll.id, poll.community_id)


_pending: dict[uuid.UUID, asyncio.Task[None]] = {}


def schedule_update(poll_id: uuid.UUID, community_id: uuid.UUID) -> None:
    """Coalesce vote updates into at most one broadcast per interval."""
    task = _pending.get(poll_id)
    if task is not None and not task.done():
        return
    _pending[poll_id] = asyncio.create_task(_send_update(poll_id, community_id))


async def _send_update(poll_id: uuid.UUID, community_id: uuid.UUID) -> None:
    await asyncio.sleep(UPDATE_INTERVAL)
    try:
        async with async_session_factory() as db:
            poll = await db.get(Poll, poll_id)
            if poll is not None and poll.status == "open":
                channel = chat_channel(community_id)
                await manager.broadcast(
                    channel, outgoing("poll_update", channel, await state(db, poll))
                )
    except Exception:
        log.exception("poll update failed")


async def close(db: AsyncSession, poll: Poll) -> None:
    """Write the final tally, mark closed and tell the room. Safe to call twice."""
    if poll.status != "open":
        return
    options = await _options(db, poll.id)
    tally = await _tally(db, poll, options)
    for option in options:
        option.votes = tally[option.id]
    poll.status = "closed"
    await db.commit()
    await redis_client.delete(_key(poll.id))
    channel = chat_channel(poll.community_id)
    await manager.broadcast(channel, outgoing("poll_closed", channel, await state(db, poll)))


async def end(db: AsyncSession, poll: Poll, actor: User) -> None:
    await close(db, poll)
    await audit(db, poll.community_id, actor.id, "poll_end")


async def close_expired(db: AsyncSession) -> int:
    """Close every poll whose time is up. Called lazily and by the stream monitor."""
    due = (
        (
            await db.execute(
                select(Poll).where(Poll.status == "open", Poll.closes_at <= datetime.now(UTC))
            )
        )
        .scalars()
        .all()
    )
    for poll in due:
        await close(db, poll)
    return len(due)


async def stop() -> None:
    for task in list(_pending.values()):
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task
    _pending.clear()
