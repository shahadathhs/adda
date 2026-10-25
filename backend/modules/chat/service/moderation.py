"""Moderation: timeouts and bans, chat settings, and the audit trail."""

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import BadRequestException, ForbiddenException
from models.channel_ban import ChannelBan
from models.community import Community
from models.mod_action import ModAction
from models.user import SystemRole, User
from modules.communities.service.roles import can_moderate, is_moderator

SLOW_MODE_CHOICES = (0, 5, 30)


async def audit(
    db: AsyncSession,
    community_id: uuid.UUID,
    actor_id: uuid.UUID | None,
    action: str,
    target_user_id: uuid.UUID | None = None,
    message_id: uuid.UUID | None = None,
    detail: str | None = None,
) -> None:
    db.add(
        ModAction(
            community_id=community_id,
            actor_id=actor_id,
            action=action,
            target_user_id=target_user_id,
            message_id=message_id,
            detail=detail,
        )
    )
    await db.commit()


async def active_ban(
    db: AsyncSession, community_id: uuid.UUID, user_id: uuid.UUID
) -> ChannelBan | None:
    now = datetime.now(UTC)
    result = await db.execute(
        select(ChannelBan)
        .where(
            ChannelBan.community_id == community_id,
            ChannelBan.user_id == user_id,
            or_(ChannelBan.expires_at.is_(None), ChannelBan.expires_at > now),
        )
        .order_by(ChannelBan.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def list_active_bans(
    db: AsyncSession, community_id: uuid.UUID
) -> list[tuple[ChannelBan, User]]:
    now = datetime.now(UTC)
    result = await db.execute(
        select(ChannelBan, User)
        .join(User, ChannelBan.user_id == User.id)
        .where(
            ChannelBan.community_id == community_id,
            or_(ChannelBan.expires_at.is_(None), ChannelBan.expires_at > now),
        )
        .order_by(ChannelBan.created_at.desc())
    )
    return [(b, u) for b, u in result.all()]


async def ban_user(
    db: AsyncSession,
    community: Community,
    actor: User,
    target: User,
    minutes: int | None,
    reason: str | None,
) -> ChannelBan:
    """Time out (`minutes` set) or ban (no minutes). Owners and moderators cannot be targeted
    by moderators; only the owner or staff may act on a moderator."""
    if target.id == actor.id:
        raise BadRequestException("You cannot moderate yourself")
    if target.id == community.owner_id:
        raise ForbiddenException("The channel owner cannot be banned")
    if target.system_role in SystemRole.STAFF:
        raise ForbiddenException("Staff accounts cannot be banned from a channel")
    actor_is_owner = actor.id == community.owner_id or actor.system_role in SystemRole.STAFF
    if await is_moderator(db, community.id, target.id) and not actor_is_owner:
        raise ForbiddenException("Only the owner can ban a moderator")
    if minutes is not None and not 1 <= minutes <= 60 * 24 * 14:
        raise BadRequestException("A timeout lasts between 1 minute and 14 days")

    # One live restriction per account: a new one replaces the old.
    for old, _ in [x for x in await list_active_bans(db, community.id) if x[1].id == target.id]:
        old.expires_at = datetime.now(UTC)
    row = ChannelBan(
        community_id=community.id,
        user_id=target.id,
        expires_at=datetime.now(UTC) + timedelta(minutes=minutes) if minutes else None,
        reason=(reason or "").strip()[:200] or None,
        created_by_id=actor.id,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    await audit(
        db,
        community.id,
        actor.id,
        "timeout" if minutes else "ban",
        target_user_id=target.id,
        detail=f"{minutes} min" if minutes else row.reason,
    )
    return row


async def lift(db: AsyncSession, community: Community, actor: User, ban_id: uuid.UUID) -> User:
    ban = await db.get(ChannelBan, ban_id)
    if ban is None or ban.community_id != community.id:
        raise BadRequestException("No such timeout or ban")
    ban.expires_at = datetime.now(UTC)
    await db.commit()
    target = await db.get(User, ban.user_id)
    assert target is not None
    await audit(db, community.id, actor.id, "lift", target_user_id=target.id)
    return target


async def set_chat_settings(
    db: AsyncSession,
    community: Community,
    actor: User,
    slow_mode_seconds: int | None,
    followers_only: bool | None,
) -> Community:
    if slow_mode_seconds is not None:
        if slow_mode_seconds not in SLOW_MODE_CHOICES:
            raise BadRequestException("Slow mode is off, 5 seconds or 30 seconds")
        community.slow_mode_seconds = slow_mode_seconds
    if followers_only is not None:
        community.followers_only = followers_only
    await db.commit()
    await db.refresh(community)
    await audit(
        db,
        community.id,
        actor.id,
        "chat_settings",
        detail=f"slow {community.slow_mode_seconds}s, followers-only {community.followers_only}",
    )
    return community


async def recent_actions(
    db: AsyncSession, community_id: uuid.UUID, limit: int = 20
) -> list[tuple[ModAction, User | None, User | None]]:
    rows = (
        await db.execute(
            select(ModAction)
            .where(ModAction.community_id == community_id, ModAction.action != "reveal")
            .order_by(ModAction.created_at.desc())
            .limit(limit)
        )
    ).scalars()
    out = []
    for action in rows:
        actor = await db.get(User, action.actor_id) if action.actor_id else None
        target = await db.get(User, action.target_user_id) if action.target_user_id else None
        out.append((action, actor, target))
    return out


async def require_moderator(db: AsyncSession, community: Community, user: User) -> None:
    if not await can_moderate(db, community, user):
        raise ForbiddenException("Only the channel owner and moderators can do this")
