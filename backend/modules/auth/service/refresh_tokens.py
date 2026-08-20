import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.security.jwt import create_access_token
from models.refresh_token import RefreshToken
from models.user import User
from modules.auth.schemas import Token
from modules.users.schemas import UserOut

REFRESH_TOKEN_PREFIX = "rt-"


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _expires_at() -> datetime:
    return datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days)


async def _insert_refresh_token(db: AsyncSession, user_id) -> str:
    raw = f"{REFRESH_TOKEN_PREFIX}{secrets.token_urlsafe(48)}"
    db.add(
        RefreshToken(
            user_id=user_id,
            token_hash=_hash_token(raw),
            expires_at=_expires_at(),
        )
    )
    return raw


async def create_session(db: AsyncSession, user: User) -> Token:
    """Issue an access token + a new refresh token (used by every login path)."""
    raw = await _insert_refresh_token(db, user.id)
    await db.commit()
    return Token(
        access_token=create_access_token(str(user.id)),
        refresh_token=raw,
        user=UserOut.model_validate(user, from_attributes=True),
    )


async def rotate_refresh_token(db: AsyncSession, raw: str) -> Token | None:
    """Validate a refresh token, revoke it, and issue a fresh pair.

    Presenting an already-revoked token is treated as theft: every refresh
    token for that user is revoked.
    """
    now = datetime.now(UTC)
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == _hash_token(raw))
    )
    stored = result.scalar_one_or_none()
    if stored is None:
        return None

    if stored.revoked_at is not None:
        await db.execute(
            update(RefreshToken)
            .where(
                RefreshToken.user_id == stored.user_id,
                RefreshToken.revoked_at.is_(None),
            )
            .values(revoked_at=now)
        )
        await db.commit()
        return None

    if stored.expires_at <= now:
        stored.revoked_at = now
        await db.commit()
        return None

    user = await db.get(User, stored.user_id)
    if user is None or not user.is_active:
        stored.revoked_at = now
        await db.commit()
        return None

    stored.revoked_at = now
    new_raw = await _insert_refresh_token(db, user.id)
    # Opportunistically drop long-expired rows.
    await db.execute(delete(RefreshToken).where(RefreshToken.expires_at <= now))
    await db.commit()
    return Token(
        access_token=create_access_token(str(user.id)),
        refresh_token=new_raw,
        user=UserOut.model_validate(user, from_attributes=True),
    )


async def revoke_refresh_token(db: AsyncSession, raw: str) -> None:
    await db.execute(
        update(RefreshToken)
        .where(
            RefreshToken.token_hash == _hash_token(raw),
            RefreshToken.revoked_at.is_(None),
        )
        .values(revoked_at=datetime.now(UTC))
    )
    await db.commit()
