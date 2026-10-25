from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.security.password import hash_password, verify_password
from models.user import User
from modules.auth.schemas import UpdateProfileRequest, UserRegister


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_username(db: AsyncSession, username: str) -> User | None:
    result = await db.execute(select(User).where(User.username == username))
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


async def update_profile(db: AsyncSession, user: User, data: UpdateProfileRequest) -> User:
    for field in ("username", "display_name", "avatar_url", "bio"):
        value = getattr(data, field)
        if value is not None:
            setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate(db: AsyncSession, email: str, password: str) -> User | None:
    user = await get_user_by_email(db, email)
    if user is None or not user.password_hash:
        # Accounts without a password can't log in with one.
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user
