"""Password-reset tokens — short-lived signed JWTs (stateless, no DB column).

Each token carries a fingerprint of the account's current password hash, so a
link stops working the moment the password changes. That makes reset links
single-use without storing anything, and it survives restarts.
"""

import hashlib
from datetime import UTC, datetime, timedelta

import jwt
from jwt import InvalidTokenError

from core.config import settings
from models.user import User


def _fingerprint(user: User) -> str:
    return hashlib.sha256((user.password_hash or "").encode()).hexdigest()[:16]


def create_reset_token(user: User) -> str:
    expire = datetime.now(UTC) + timedelta(minutes=settings.reset_token_expire_minutes)
    payload = {"sub": str(user.id), "purpose": "reset", "pv": _fingerprint(user), "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def reset_token_subject(token: str) -> tuple[str, str] | None:
    """Return `(user_id, fingerprint)` for a well-formed, unexpired reset token."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except InvalidTokenError:
        return None
    sub, pv = payload.get("sub"), payload.get("pv")
    if payload.get("purpose") != "reset" or not sub or not pv:
        return None
    return str(sub), str(pv)


def reset_token_matches(token_fingerprint: str, user: User) -> bool:
    """True while the account still has the password the token was issued for."""
    return token_fingerprint == _fingerprint(user)
