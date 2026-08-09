"""Password-reset tokens — short-lived signed JWTs (stateless, no DB column)."""

from datetime import UTC, datetime, timedelta

import jwt
from jwt import InvalidTokenError

from core.config import settings


def create_reset_token(user_id: str) -> str:
    expire = datetime.now(UTC) + timedelta(minutes=settings.reset_token_expire_minutes)
    payload = {"sub": user_id, "purpose": "reset", "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def verify_reset_token(token: str) -> str | None:
    """Return the user id if the token is a valid reset token, else None."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except InvalidTokenError:
        return None
    if payload.get("purpose") != "reset":
        return None
    sub = payload.get("sub")
    return str(sub) if sub else None
