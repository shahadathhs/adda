from sqlalchemy.ext.asyncio import AsyncSession

from core.security.password import hash_password
from models.user import User
from modules.users.schemas import AdminUserUpdate


async def update_user_fields(
    db: AsyncSession, user: User, data: AdminUserUpdate
) -> User:
    if data.is_admin is not None:
        user.is_admin = data.is_admin
    if data.is_active is not None:
        user.is_active = data.is_active
    await db.commit()
    await db.refresh(user)
    return user


async def set_password(db: AsyncSession, user: User, password: str) -> None:
    user.password_hash = hash_password(password)
    await db.commit()


async def delete_user(db: AsyncSession, user: User) -> None:
    await db.delete(user)
    await db.commit()
