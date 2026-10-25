"""Notification preferences: an account-wide default plus per-channel overrides."""

import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.notification_pref import NotificationPref


@dataclass(frozen=True)
class Prefs:
    bell: bool
    email: bool


DEFAULT = Prefs(bell=True, email=False)


async def effective(db: AsyncSession, user_id: uuid.UUID, community_id: uuid.UUID | None) -> Prefs:
    """The channel's override if there is one, else the account default, else the built-in one."""
    rows = (
        (await db.execute(select(NotificationPref).where(NotificationPref.user_id == user_id)))
        .scalars()
        .all()
    )
    default = next((r for r in rows if r.community_id is None), None)
    base = Prefs(default.bell, default.email) if default else DEFAULT
    if community_id is not None:
        override = next((r for r in rows if r.community_id == community_id), None)
        if override:
            return Prefs(override.bell, override.email)
    return base


async def effective_for_many(
    db: AsyncSession, user_ids: list[uuid.UUID], community_id: uuid.UUID
) -> dict[uuid.UUID, Prefs]:
    """Prefs for many accounts of one channel in a single query."""
    if not user_ids:
        return {}
    rows = (
        (await db.execute(select(NotificationPref).where(NotificationPref.user_id.in_(user_ids))))
        .scalars()
        .all()
    )
    defaults = {r.user_id: Prefs(r.bell, r.email) for r in rows if r.community_id is None}
    overrides = {r.user_id: Prefs(r.bell, r.email) for r in rows if r.community_id == community_id}
    return {uid: overrides.get(uid) or defaults.get(uid) or DEFAULT for uid in user_ids}


async def list_prefs(db: AsyncSession, user_id: uuid.UUID) -> list[NotificationPref]:
    result = await db.execute(select(NotificationPref).where(NotificationPref.user_id == user_id))
    return list(result.scalars())


async def set_pref(
    db: AsyncSession,
    user_id: uuid.UUID,
    community_id: uuid.UUID | None,
    bell: bool | None,
    email: bool | None,
) -> NotificationPref:
    query = select(NotificationPref).where(NotificationPref.user_id == user_id)
    query = query.where(
        NotificationPref.community_id.is_(None)
        if community_id is None
        else NotificationPref.community_id == community_id
    )
    row = (await db.execute(query)).scalar_one_or_none()
    if row is None:
        row = NotificationPref(
            user_id=user_id,
            community_id=community_id,
            bell=DEFAULT.bell if bell is None else bell,
            email=DEFAULT.email if email is None else email,
        )
        db.add(row)
    else:
        if bell is not None:
            row.bell = bell
        if email is not None:
            row.email = email
    await db.commit()
    await db.refresh(row)
    return row
