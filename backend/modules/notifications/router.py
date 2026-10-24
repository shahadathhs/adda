"""Bell notifications and notification preferences."""

import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.database import get_db
from core.exceptions import BadRequestException
from core.security.deps import get_current_user
from models.community import Community
from models.notification import Notification
from models.user import User
from modules.communities.service.follows import list_followed_communities
from modules.notifications.schemas import (
    MarkReadBody,
    NotificationList,
    NotificationOut,
    PrefIn,
    PrefOut,
    PrefsOut,
)
from modules.notifications.service import prefs as prefs_service
from modules.notifications.service.notify import wire

router = APIRouter(tags=["notifications"])


async def _unread(db: AsyncSession, user_id: uuid.UUID) -> int:
    return int(
        (
            await db.execute(
                select(func.count())
                .select_from(Notification)
                .where(Notification.user_id == user_id, Notification.read_at.is_(None))
            )
        ).scalar()
        or 0
    )


@router.get("/notifications", response_model=NotificationList)
async def list_notifications(
    limit: int = Query(30, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationList:
    rows = (
        (
            await db.execute(
                select(Notification)
                .where(Notification.user_id == current_user.id)
                .order_by(Notification.created_at.desc(), Notification.id.desc())
                .limit(limit)
            )
        )
        .scalars()
        .all()
    )
    return NotificationList(
        items=[NotificationOut(**wire(r)) for r in rows],
        unread=await _unread(db, current_user.id),
    )


@router.post("/notifications/read")
async def mark_read(
    body: MarkReadBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, int]:
    """Mark some (or, with no ids, all) of your notifications read."""
    query = (
        update(Notification)
        .where(Notification.user_id == current_user.id, Notification.read_at.is_(None))
        .values(read_at=datetime.now(UTC))
    )
    if body.ids is not None:
        query = query.where(Notification.id.in_(body.ids))
    await db.execute(query)
    await db.commit()
    return {"unread": await _unread(db, current_user.id)}


# ── Preferences ───────────────────────────────────────────────────────
@router.get("/me/notification-prefs", response_model=PrefsOut)
async def get_prefs(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
) -> PrefsOut:
    stored = {p.community_id: p for p in await prefs_service.list_prefs(db, current_user.id)}
    default = stored.get(None)
    channels = []
    for community in await list_followed_communities(db, current_user.id):
        p = stored.get(community.id)
        eff = await prefs_service.effective(db, current_user.id, community.id)
        channels.append(
            PrefOut(
                community_id=community.id,
                community_name=community.name,
                bell=p.bell if p else eff.bell,
                email=p.email if p else eff.email,
            )
        )
    return PrefsOut(
        email_available=bool(settings.smtp_host),
        default=PrefOut(
            community_id=None,
            bell=default.bell if default else prefs_service.DEFAULT.bell,
            email=default.email if default else prefs_service.DEFAULT.email,
        ),
        channels=channels,
    )


@router.put("/me/notification-prefs", response_model=PrefOut)
async def put_prefs(
    body: PrefIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PrefOut:
    if body.email and not settings.smtp_host:
        raise BadRequestException("Email is not set up on this server")
    community_name = None
    if body.community_id is not None:
        community = await db.get(Community, body.community_id)
        if community is None:
            raise BadRequestException("Unknown channel")
        community_name = community.name
    row = await prefs_service.set_pref(
        db, current_user.id, body.community_id, body.bell, body.email
    )
    return PrefOut(
        community_id=row.community_id,
        community_name=community_name,
        bell=row.bell,
        email=row.email,
    )
