"""@mentions: find them, resolve them to accounts, store them."""

import re
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.message_mention import MessageMention
from models.user import User

_MENTION = re.compile(r"(?<![\w@])@([A-Za-z0-9_]{3,50})")
MAX_MENTIONS = 5


def extract(content: str) -> list[str]:
    """Distinct lower-cased usernames mentioned in a message, in order, capped."""
    seen: list[str] = []
    for match in _MENTION.finditer(content):
        name = match.group(1).lower()
        if name not in seen:
            seen.append(name)
    return seen[:MAX_MENTIONS]


async def resolve(db: AsyncSession, names: list[str], exclude: uuid.UUID) -> list[User]:
    """Accounts for those names. An anonymous account is never mentionable by name."""
    if not names:
        return []
    result = await db.execute(
        select(User).where(
            func.lower(User.username).in_(names),
            User.identity_mode == "named",
            User.is_active.is_(True),
            User.id != exclude,
        )
    )
    return list(result.scalars())


async def store(db: AsyncSession, message_id: uuid.UUID, users: list[User]) -> None:
    for user in users:
        db.add(MessageMention(message_id=message_id, user_id=user.id))
    if users:
        await db.commit()
