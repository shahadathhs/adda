"""Identity mode: who a viewer is allowed to see behind a chat message.

The database always records the real account. The *public* author built here is
what goes on the wire and into history, so anonymous authors are stripped on the
server rather than hidden by the client.
"""

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from models.message import Message
from models.mod_action import ModAction
from models.user import User

NAMED = "named"
ANONYMOUS = "anonymous"
MODES = (NAMED, ANONYMOUS)


def public_author(user: User, display_mode: str, badges: list[str]) -> dict[str, Any]:
    if display_mode == ANONYMOUS:
        return {
            "id": None,
            "username": None,
            "display_name": "Anonymous",
            "avatar_url": None,
            "badges": [],
        }
    return {
        "id": str(user.id),
        "username": user.username,
        "display_name": user.display_name,
        "avatar_url": user.avatar_url,
        "badges": badges,
    }


async def set_identity_mode(db: AsyncSession, user: User, mode: str) -> User:
    user.identity_mode = mode
    await db.commit()
    await db.refresh(user)
    return user


async def reveal_author(
    db: AsyncSession, message: Message, author: User, actor: User
) -> dict[str, Any]:
    """The real account behind a message. Always audited."""
    db.add(
        ModAction(
            community_id=message.community_id,
            actor_id=actor.id,
            action="reveal",
            target_user_id=author.id,
            message_id=message.id,
        )
    )
    await db.commit()
    return public_author(author, NAMED, [])
