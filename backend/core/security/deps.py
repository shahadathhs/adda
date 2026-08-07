import uuid

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import UnauthorizedException
from core.security.jwt import decode_access_token
from core.database import get_db
from models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def _credentials_error() -> UnauthorizedException:
    """The 401 raised for a bad/missing bearer token (keeps the WWW-Authenticate header)."""
    return UnauthorizedException(
        "Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    user_id = decode_access_token(token)
    if user_id is None:
        raise _credentials_error()

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise _credentials_error()
    return user


async def get_current_user_ws(token: str) -> User | None:
    """Token resolver for the WebSocket handshake (no HTTPException)."""
    from core.database import async_session_factory

    user_id = decode_access_token(token)
    if user_id is None:
        return None
    async with async_session_factory() as db:
        result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
        return result.scalar_one_or_none()
