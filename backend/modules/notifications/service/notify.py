"""Create bell entries and push them live; send the optional went-live email."""

import logging
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.email import send_email
from core.redis_client import redis_client
from models.community import Community
from models.follow import Follow
from models.notification import Notification
from models.user import User
from modules.notifications.service import prefs as prefs_service
from modules.realtime.manager import manager
from modules.realtime.protocol import outgoing

log = logging.getLogger("adda.notifications")

EMAIL_INTERVAL_SECONDS = 3600  # at most one live-alert email per account and channel per hour


def wire(row: Notification) -> dict[str, Any]:
    return {
        "id": str(row.id),
        "kind": row.kind,
        "payload": row.payload,
        "read": row.read_at is not None,
        "created_at": row.created_at.isoformat(),
    }


async def _store_and_push(
    db: AsyncSession, user_id: uuid.UUID, kind: str, payload: dict[str, Any]
) -> Notification:
    row = Notification(user_id=user_id, kind=kind, payload=payload)
    db.add(row)
    await db.commit()
    await db.refresh(row)
    channel = f"user/{user_id}"
    await manager.broadcast(channel, outgoing("notification", channel, wire(row)))
    return row


async def notify(
    db: AsyncSession,
    user_id: uuid.UUID,
    kind: str,
    payload: dict[str, Any],
    community_id: uuid.UUID | None = None,
) -> Notification | None:
    """A bell entry for one account, unless they have turned it off for this channel."""
    prefs = await prefs_service.effective(db, user_id, community_id)
    if not prefs.bell:
        return None
    return await _store_and_push(db, user_id, kind, payload)


def _watch_url(community: Community) -> str:
    base = settings.password_reset_url.rsplit("/", 1)[0]
    return f"{base}/channel/{community.slug}"


async def notify_went_live(db: AsyncSession, community: Community) -> int:
    """Tell every follower with the bell on; email those who opted in (once an hour per channel)."""
    follows = list(
        (await db.execute(select(Follow.user_id).where(Follow.community_id == community.id)))
        .scalars()
        .all()
    )
    prefs = await prefs_service.effective_for_many(db, follows, community.id)
    payload = {
        "community_id": str(community.id),
        "community_name": community.name,
        "community_slug": community.slug,
        "title": community.stream_title,
    }
    sent = 0
    for user_id in follows:
        p = prefs[user_id]
        if p.bell:
            await _store_and_push(db, user_id, "went_live", payload)
            sent += 1
        if p.email and settings.smtp_host:
            await _maybe_email(db, user_id, community)
    return sent


async def _maybe_email(db: AsyncSession, user_id: uuid.UUID, community: Community) -> None:
    key = f"adda:live-email:{community.id}:{user_id}"
    if not await redis_client.set(key, "1", nx=True, ex=EMAIL_INTERVAL_SECONDS):
        return  # already emailed this account about this channel within the hour
    user = await db.get(User, user_id)
    if user is None:
        return
    url = _watch_url(community)
    title = community.stream_title or "a new stream"
    text = f"{community.name} is live: {title}\n\nWatch: {url}\n"
    html = (
        f'<div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto">'
        f'<h2 style="color:#f5a623">{community.name} is live</h2><p>{title}</p>'
        f'<p><a href="{url}" style="display:inline-block;background:#f5a623;color:#1a1205;'
        f'padding:12px 22px;border-radius:4px;text-decoration:none;font-weight:600">'
        f"Watch now</a></p>"
        f'<p style="color:#6b7280;font-size:14px">You get this because you turned on live emails '
        f"for this channel. Change it in your settings.</p></div>"
    )
    await send_email(user.email, f"{community.name} is live", html, text)
