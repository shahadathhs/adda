import uuid

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.user import User


async def get_user(db: AsyncSession, user_id: uuid.UUID) -> User | None:
    return await db.get(User, user_id)


async def list_users(db: AsyncSession, q: str | None = None) -> list[User]:
    """All users, newest first; optionally filtered by username/email substring."""
    stmt = select(User).order_by(User.created_at.desc())
    if q:
        pat = f"%{q}%"
        stmt = stmt.where(or_(User.username.ilike(pat), User.email.ilike(pat)))
    return list((await db.execute(stmt)).scalars().all())
