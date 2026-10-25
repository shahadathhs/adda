"""One pinned message per channel."""

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from models.community import Community
from models.message import Message
from models.user import User
from modules.chat.service.messages import MessageRejected, chat_channel
from modules.chat.service.moderation import audit
from modules.chat.service.serialize import serialize_one
from modules.realtime.manager import manager
from modules.realtime.protocol import outgoing


async def pinned_payload(db: AsyncSession, community: Community) -> dict[str, Any] | None:
    if community.pinned_message_id is None:
        return None
    message = await db.get(Message, community.pinned_message_id)
    if message is None or message.deleted_at is not None:
        return None
    author = await db.get(User, message.user_id)
    assert author is not None
    return await serialize_one(db, community, message, author)


async def pin(db: AsyncSession, community: Community, actor: User, message: Message) -> None:
    if message.community_id != community.id or message.deleted_at is not None:
        raise MessageRejected("not_found", "Message not found")
    community.pinned_message_id = message.id
    await db.commit()
    await audit(db, community.id, actor.id, "pin", message_id=message.id)
    await _announce(db, community)


async def unpin(db: AsyncSession, community: Community, actor: User) -> None:
    if community.pinned_message_id is None:
        return
    community.pinned_message_id = None
    await db.commit()
    await audit(db, community.id, actor.id, "unpin")
    await _announce(db, community)


async def _announce(db: AsyncSession, community: Community) -> None:
    channel = chat_channel(community.id)
    await manager.broadcast(
        channel, outgoing("pin_update", channel, {"message": await pinned_payload(db, community)})
    )
