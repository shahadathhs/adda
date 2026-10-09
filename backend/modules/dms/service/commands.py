"""DM write commands: open threads, send, read, block.

Every state change broadcasts on BOTH participants' personal channels
(`user/<id>`) so multi-device and the peer stay in sync.
"""

import uuid
from datetime import UTC, datetime

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import BadRequestException, ForbiddenException, NotFoundException
from models.dm import DmMessage, DmThread, UserBlock
from modules.dms.service import queries
from modules.realtime.manager import manager
from modules.realtime.protocol import outgoing


def _canonical_pair(a: uuid.UUID | str, b: uuid.UUID | str) -> tuple[str, str]:
    a_s, b_s = str(a), str(b)
    return (a_s, b_s) if a_s < b_s else (b_s, a_s)


async def open_thread(db: AsyncSession, user_id: uuid.UUID | str, peer_id: str) -> DmThread:
    me = str(user_id)
    if peer_id == me:
        raise BadRequestException("Cannot open a conversation with yourself")

    peer = await queries.get_user(db, peer_id)
    if peer is None:
        raise NotFoundException("User not found")
    if await queries.is_blocked_pair(db, me, peer_id):
        # Generic on purpose — never reveal block state of others.
        raise ForbiddenException("Cannot message this user")

    thread = await queries.find_pair_thread(db, me, peer_id)
    if thread is not None:
        return thread

    a, b = _canonical_pair(me, peer_id)
    thread = DmThread(user_a_id=uuid.UUID(a), user_b_id=uuid.UUID(b))
    db.add(thread)
    await db.commit()
    await db.refresh(thread)
    return thread


async def send_message(
    db: AsyncSession, thread: DmThread, sender_id: uuid.UUID | str, content: str
) -> DmMessage:
    if await queries.is_blocked_pair(db, thread.user_a_id, thread.user_b_id):
        raise ForbiddenException("Cannot message this user")

    message = DmMessage(
        thread_id=thread.id,
        sender_id=uuid.UUID(str(sender_id)),
        content=content,
    )
    db.add(message)
    thread.last_message_at = datetime.now(UTC)
    # Sending implies having read everything up to here.
    if str(thread.user_a_id) == str(sender_id):
        thread.read_a_id = message.id
    else:
        thread.read_b_id = message.id
    await db.commit()
    await db.refresh(message)

    sender = await queries.get_user(db, sender_id)
    payload = {
        "id": str(message.id),
        "thread_id": str(thread.id),
        "sender_id": str(sender_id),
        "username": sender.username if sender else "unknown",
        "display_name": sender.display_name if sender else "unknown",
        "content": content,
        "created_at": message.created_at.isoformat(),
    }
    for uid in (str(thread.user_a_id), str(thread.user_b_id)):
        await manager.broadcast(f"user/{uid}", outgoing("dm_message", f"user/{uid}", payload))
    return message


async def mark_read(
    db: AsyncSession, thread: DmThread, user_id: uuid.UUID | str, message_id: str
) -> None:
    message = await queries.get_message(db, thread.id, message_id)
    if message is None:
        raise NotFoundException("Message not found")

    if str(thread.user_a_id) == str(user_id):
        thread.read_a_id = message.id
    else:
        thread.read_b_id = message.id
    await db.commit()

    payload = {
        "thread_id": str(thread.id),
        "reader_id": str(user_id),
        "last_read_message_id": str(message.id),
    }
    for uid in (str(thread.user_a_id), str(thread.user_b_id)):
        await manager.broadcast(f"user/{uid}", outgoing("dm_read", f"user/{uid}", payload))


async def block(db: AsyncSession, blocker_id: uuid.UUID | str, blocked_id: str) -> None:
    if str(blocker_id) == blocked_id:
        raise BadRequestException("Cannot block yourself")
    exists = await queries.get_user(db, blocked_id)
    if exists is None:
        raise NotFoundException("User not found")
    if not await queries.is_blocked_pair(db, blocker_id, blocked_id):
        db.add(UserBlock(blocker_id=uuid.UUID(str(blocker_id)), blocked_id=uuid.UUID(blocked_id)))
        await db.commit()


async def unblock(db: AsyncSession, blocker_id: uuid.UUID | str, blocked_id: str) -> None:
    await db.execute(
        delete(UserBlock).where(
            UserBlock.blocker_id == uuid.UUID(str(blocker_id)),
            UserBlock.blocked_id == uuid.UUID(blocked_id),
        )
    )
    await db.commit()
