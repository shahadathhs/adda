"""DM read queries."""

import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.dm import DmMessage, DmThread, UserBlock
from models.user import User


async def get_thread(db: AsyncSession, thread_id: uuid.UUID | str) -> DmThread | None:
    result = await db.execute(select(DmThread).where(DmThread.id == thread_id))
    return result.scalar_one_or_none()


async def get_thread_for_user(
    db: AsyncSession, thread_id: uuid.UUID | str, user_id: uuid.UUID | str
) -> DmThread | None:
    thread = await get_thread(db, thread_id)
    if thread is None:
        return None
    uid = str(user_id)
    if str(thread.user_a_id) != uid and str(thread.user_b_id) != uid:
        return None
    return thread


async def find_pair_thread(
    db: AsyncSession, user_a: uuid.UUID | str, user_b: uuid.UUID | str
) -> DmThread | None:
    a, b = sorted([str(user_a), str(user_b)])
    result = await db.execute(
        select(DmThread).where(DmThread.user_a_id == a, DmThread.user_b_id == b)
    )
    return result.scalar_one_or_none()


async def get_user(db: AsyncSession, user_id: uuid.UUID | str) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_user_by_username(db: AsyncSession, username: str) -> User | None:
    result = await db.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()


async def list_threads(db: AsyncSession, user_id: uuid.UUID | str) -> list[DmThread]:
    uid = str(user_id)
    result = await db.execute(
        select(DmThread)
        .where(or_(DmThread.user_a_id == uid, DmThread.user_b_id == uid))
        .order_by(DmThread.last_message_at.desc().nulls_last(), DmThread.created_at.desc())
    )
    return list(result.scalars())


def peer_of(thread: DmThread, user_id: uuid.UUID | str) -> uuid.UUID:
    """The OTHER member of the thread (sync — pure attribute access)."""
    return thread.user_b_id if str(thread.user_a_id) == str(user_id) else thread.user_a_id


async def last_message(db: AsyncSession, thread: DmThread) -> DmMessage | None:
    result = await db.execute(
        select(DmMessage)
        .where(DmMessage.thread_id == thread.id)
        .order_by(DmMessage.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def unread_count(db: AsyncSession, thread: DmThread, user_id: uuid.UUID | str) -> int:
    uid = str(user_id)
    cursor = thread.read_a_id if str(thread.user_a_id) == uid else thread.read_b_id
    conditions = [
        DmMessage.thread_id == thread.id,
        DmMessage.sender_id != uid,
    ]
    if cursor is not None:
        conditions.append(DmMessage.id > cursor)
    result = await db.execute(select(func.count()).select_from(DmMessage).where(*conditions))
    return int(result.scalar_one())


async def list_messages(
    db: AsyncSession, thread_id: uuid.UUID | str, before_id: str | None, limit: int
) -> list[DmMessage]:
    """Messages oldest→newest, at most `limit`, older than `before_id`."""
    query = select(DmMessage).where(DmMessage.thread_id == thread_id)
    if before_id:
        result = await db.execute(select(DmMessage.created_at).where(DmMessage.id == before_id))
        anchor = result.scalar_one_or_none()
        if anchor is not None:
            query = query.where(DmMessage.created_at < anchor)
    result = await db.execute(query.order_by(DmMessage.created_at.desc()).limit(limit))
    return list(reversed(result.scalars().all()))


async def get_message(
    db: AsyncSession, thread_id: uuid.UUID | str, message_id: uuid.UUID | str
) -> DmMessage | None:
    result = await db.execute(
        select(DmMessage).where(DmMessage.thread_id == thread_id, DmMessage.id == message_id)
    )
    return result.scalar_one_or_none()


async def is_blocked_pair(
    db: AsyncSession, user_a: uuid.UUID | str, user_b: uuid.UUID | str
) -> bool:
    a, b = str(user_a), str(user_b)
    result = await db.execute(
        select(UserBlock.id).where(
            or_(
                (UserBlock.blocker_id == a) & (UserBlock.blocked_id == b),
                (UserBlock.blocker_id == b) & (UserBlock.blocked_id == a),
            )
        )
    )
    return result.scalar_one_or_none() is not None


async def list_blocked(db: AsyncSession, blocker_id: uuid.UUID | str) -> list[User]:
    result = await db.execute(
        select(User)
        .join(UserBlock, UserBlock.blocked_id == User.id)
        .where(UserBlock.blocker_id == blocker_id)
        .order_by(User.username)
    )
    return list(result.scalars())
