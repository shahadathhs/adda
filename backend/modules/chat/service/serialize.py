"""One place that turns messages into the public wire/REST shape, batched per page."""

import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.community import Community
from models.message import Message
from models.message_mention import MessageMention
from models.message_reaction import MessageReaction
from models.user import User
from modules.chat.service.badges import badges_for
from modules.chat.service.identity import public_author


async def serialize(
    db: AsyncSession,
    community: Community,
    rows: list[tuple[Message, User]],
    channel: str | None = None,
    viewer_id: uuid.UUID | None = None,
) -> list[dict[str, Any]]:
    """Messages with public authors, badges, reply previews, mentions and reaction counts.

    Everything is fetched in a handful of queries for the whole page, not per message.
    """
    if not rows:
        return []
    ids = [m.id for m, _ in rows]

    # Reply parents (deleted ones become tombstones) and their authors.
    parent_ids = {m.reply_to_id for m, _ in rows if m.reply_to_id}
    parents: dict[uuid.UUID, tuple[Message, User]] = {}
    if parent_ids:
        found = await db.execute(
            select(Message, User)
            .join(User, Message.user_id == User.id)
            .where(Message.id.in_(parent_ids))
        )
        parents = {m.id: (m, u) for m, u in found.all()}

    author_ids = {u.id for _, u in rows} | {u.id for _, u in parents.values()}
    badges = await badges_for(db, community, author_ids)

    mention_rows = await db.execute(
        select(MessageMention.message_id, MessageMention.user_id).where(
            MessageMention.message_id.in_(ids)
        )
    )
    mentions: dict[uuid.UUID, list[str]] = {}
    for mid, uid in mention_rows.all():
        mentions.setdefault(mid, []).append(str(uid))

    counts: dict[uuid.UUID, dict[str, int]] = {}
    for mid, emoji, n in (
        await db.execute(
            select(MessageReaction.message_id, MessageReaction.emoji, func.count())
            .where(MessageReaction.message_id.in_(ids))
            .group_by(MessageReaction.message_id, MessageReaction.emoji)
        )
    ).all():
        counts.setdefault(mid, {})[emoji] = int(n)

    mine: dict[uuid.UUID, list[str]] = {}
    if viewer_id is not None:
        for mid, emoji in (
            await db.execute(
                select(MessageReaction.message_id, MessageReaction.emoji).where(
                    MessageReaction.message_id.in_(ids), MessageReaction.user_id == viewer_id
                )
            )
        ).all():
            mine.setdefault(mid, []).append(emoji)

    out: list[dict[str, Any]] = []
    for message, user in rows:
        reply = None
        if message.reply_to_id:
            parent = parents.get(message.reply_to_id)
            if parent is None or parent[0].deleted_at is not None:
                reply = {"id": str(message.reply_to_id), "deleted": True}
            else:
                pm, pu = parent
                reply = {
                    "id": str(pm.id),
                    "deleted": False,
                    "content": pm.content[:120],
                    "author": public_author(pu, pm.display_mode, badges.get(pu.id, [])),
                }
        payload: dict[str, Any] = {
            "id": str(message.id),
            "community_id": str(message.community_id),
            "author": public_author(user, message.display_mode, badges.get(user.id, [])),
            "content": message.content,
            "created_at": message.created_at.isoformat(),
            "reply_to": str(message.reply_to_id) if message.reply_to_id else None,
            "reply": reply,
            "mentions": mentions.get(message.id, []),
            "reactions": counts.get(message.id, {}),
        }
        if viewer_id is not None:
            payload["my_reactions"] = mine.get(message.id, [])
        if channel is not None:
            payload["channel"] = channel
        out.append(payload)
    return out


async def serialize_one(
    db: AsyncSession,
    community: Community,
    message: Message,
    user: User,
    channel: str | None = None,
) -> dict[str, Any]:
    return (await serialize(db, community, [(message, user)], channel))[0]
