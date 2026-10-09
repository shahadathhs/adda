"""Direct messages — private 1:1 threads. All routes require auth.

Privacy rule: DMs are invisible to admins by design. There is no admin
surface and there will not be one.
"""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.exceptions import ForbiddenException, NotFoundException
from core.security.deps import get_current_user
from models.user import User
from modules.dms.schemas import (
    DmMessageOut,
    MarkReadRequest,
    OpenThreadRequest,
    PeerOut,
    SendMessageRequest,
    ThreadOut,
)
from modules.dms.service import commands, queries

router = APIRouter(prefix="/dms", tags=["dms"])


async def _thread_out(db: AsyncSession, thread, user_id: uuid.UUID | str) -> ThreadOut:
    peer_id = queries.peer_of(thread, user_id)
    peer = await queries.get_user(db, peer_id)
    if peer is None:
        raise NotFoundException("User not found")
    last = await queries.last_message(db, thread)
    return ThreadOut(
        id=str(thread.id),
        peer=PeerOut(
            id=str(peer.id),
            username=peer.username,
            display_name=peer.display_name,
            avatar_url=peer.avatar_url,
        ),
        last_message=(
            DmMessageOut(
                id=str(last.id),
                thread_id=str(thread.id),
                sender_id=str(last.sender_id),
                content=last.content,
                created_at=last.created_at.isoformat(),
            )
            if last
            else None
        ),
        unread_count=await queries.unread_count(db, thread, user_id),
        created_at=thread.created_at.isoformat(),
    )


async def _member_thread(db: AsyncSession, thread_id: uuid.UUID, user: User):
    thread = await queries.get_thread_for_user(db, thread_id, user.id)
    if thread is None:
        raise NotFoundException("Thread not found")
    if await queries.is_blocked_pair(db, thread.user_a_id, thread.user_b_id):
        # A block freezes the thread for both sides — messages and reads.
        raise ForbiddenException("Cannot message this user")
    return thread


@router.get("/resolve/{username}", response_model=PeerOut)
async def resolve_peer(
    username: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PeerOut:
    """Resolve a username for the DM composer — minimal public profile."""
    user = await queries.get_user_by_username(db, username)
    if user is None:
        raise NotFoundException("User not found")
    return PeerOut(
        id=str(user.id),
        username=user.username,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
    )


@router.get("/threads", response_model=list[ThreadOut])
async def list_threads(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ThreadOut]:
    threads = await queries.list_threads(db, current_user.id)
    return [await _thread_out(db, t, current_user.id) for t in threads]


@router.post("/threads", response_model=ThreadOut)
async def open_thread(
    data: OpenThreadRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ThreadOut:
    thread = await commands.open_thread(db, current_user.id, data.peer_id)
    return await _thread_out(db, thread, current_user.id)


@router.get("/threads/{thread_id}/messages", response_model=list[DmMessageOut])
async def list_messages(
    thread_id: uuid.UUID,
    before: str | None = Query(default=None),
    limit: int = Query(default=50, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[DmMessageOut]:
    thread = await _member_thread(db, thread_id, current_user)
    messages = await queries.list_messages(db, thread.id, before, limit)
    return [
        DmMessageOut(
            id=str(m.id),
            thread_id=str(m.thread_id),
            sender_id=str(m.sender_id),
            content=m.content,
            created_at=m.created_at.isoformat(),
        )
        for m in messages
    ]


@router.post("/threads/{thread_id}/messages", response_model=DmMessageOut)
async def send_message(
    thread_id: uuid.UUID,
    data: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DmMessageOut:
    thread = await _member_thread(db, thread_id, current_user)
    message = await commands.send_message(db, thread, current_user.id, data.content.strip())
    return DmMessageOut(
        id=str(message.id),
        thread_id=str(message.thread_id),
        sender_id=str(message.sender_id),
        content=message.content,
        created_at=message.created_at.isoformat(),
    )


@router.post("/threads/{thread_id}/read")
async def mark_read(
    thread_id: uuid.UUID,
    data: MarkReadRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, bool]:
    thread = await queries.get_thread_for_user(db, thread_id, current_user.id)
    if thread is None:
        raise NotFoundException("Thread not found")
    await commands.mark_read(db, thread, current_user.id, data.message_id)
    return {"ok": True}


@router.get("/blocks", response_model=list[PeerOut])
async def list_blocks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[PeerOut]:
    blocked = await queries.list_blocked(db, current_user.id)
    return [
        PeerOut(
            id=str(u.id),
            username=u.username,
            display_name=u.display_name,
            avatar_url=u.avatar_url,
        )
        for u in blocked
    ]


@router.post("/blocks/{user_id}")
async def block_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, bool]:
    await commands.block(db, current_user.id, str(user_id))
    return {"ok": True}


@router.delete("/blocks/{user_id}")
async def unblock_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, bool]:
    await commands.unblock(db, current_user.id, str(user_id))
    return {"ok": True}
