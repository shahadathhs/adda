import re
import secrets

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.security.password import hash_password, verify_password
from models.user import User
from modules.auth.schemas import UserRegister


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_username(db: AsyncSession, username: str) -> User | None:
    result = await db.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()


async def get_user_by_google_id(db: AsyncSession, google_id: str) -> User | None:
    result = await db.execute(select(User).where(User.google_id == google_id))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, data: UserRegister) -> User:
    user = User(
        username=data.username,
        email=data.email,
        display_name=data.display_name,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def set_password(db: AsyncSession, user: User, new_password: str) -> User:
    user.password_hash = hash_password(new_password)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate(db: AsyncSession, email: str, password: str) -> User | None:
    user = await get_user_by_email(db, email)
    if user is None or not user.password_hash:
        # OAuth-only accounts (no password) can't log in with a password.
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


async def _unique_username(db: AsyncSession, email: str) -> str:
    """Derive a free, valid username from an email's local part."""
    base = re.sub(r"[^a-zA-Z0-9_]", "", email.split("@", 1)[0])[:30]
    if len(base) < 3:
        base = f"{base}user"
    candidate = base
    while await get_user_by_username(db, candidate):
        candidate = f"{base}_{secrets.token_hex(3)}"
    return candidate


async def get_or_create_google_user(
    db: AsyncSession,
    *,
    google_id: str,
    email: str,
    name: str | None,
    picture: str | None,
) -> User:
    """Find a user by Google id; else link an existing email; else create one."""
    user = await get_user_by_google_id(db, google_id)
    if user is not None:
        return user

    user = await get_user_by_email(db, email)
    if user is not None:
        user.google_id = google_id
        await db.commit()
        await db.refresh(user)
        return user

    username = await _unique_username(db, email)
    user = User(
        email=email,
        username=username,
        display_name=name or email.split("@", 1)[0],
        google_id=google_id,
        avatar_url=picture,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
