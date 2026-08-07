"""Idempotent startup seeding.

Ensures a superadmin exists (and, in dev, two test users). Runs on every
backend startup and only creates accounts that aren't already there, so it's
safe to leave on. All credentials come from config/env (see `Settings`).
"""

import logging

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.database import async_session_factory
from core.security.password import hash_password
from models.user import User

logger = logging.getLogger("adda.seed")


async def _ensure_user(
    db: AsyncSession,
    username: str,
    email: str,
    password: str,
    *,
    is_admin: bool = False,
) -> None:
    existing = (
        await db.execute(select(User).where(or_(User.username == username, User.email == email)))
    ).scalar_one_or_none()
    if existing is not None:
        return
    db.add(
        User(
            username=username,
            email=email,
            display_name=username,
            password_hash=hash_password(password),
            is_admin=is_admin,
        )
    )
    await db.commit()
    logger.info("Seeded user %r (is_admin=%s)", username, is_admin)


async def seed_db() -> None:
    try:
        async with async_session_factory() as db:
            await _ensure_user(
                db,
                settings.superadmin_username,
                settings.superadmin_email,
                settings.superadmin_password,
                is_admin=True,
            )
            if settings.seed_test_users:
                await _ensure_user(db, "alice", "alice@example.com", settings.seed_test_password)
                await _ensure_user(db, "bob", "bob@example.com", settings.seed_test_password)
    except Exception:
        # Seeding must never block startup.
        logger.exception("Seeding failed; continuing startup anyway")
