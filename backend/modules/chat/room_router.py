"""Chat room REST: initial state, settings, pin, timeouts and bans, recent mod actions."""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.exceptions import NotFoundException
from core.security.deps import get_current_user, get_optional_user
from models.community import Community
from models.message import Message
from models.user import User
from modules.chat.schemas import BanIn, BanOut, ChatSettingsIn, ModActionOut, PinIn
from modules.chat.service import emotes as emotes_service
from modules.chat.service import moderation, pins, polls
from modules.chat.service.messages import chat_channel
from modules.communities.service.queries import get_community
from modules.realtime.manager import manager
from modules.realtime.protocol import outgoing

router = APIRouter(prefix="/communities/{community_id}", tags=["chat"])


async def _community(db: AsyncSession, community_id: uuid.UUID) -> Community:
    community = await get_community(db, community_id)
    if community is None:
        raise NotFoundException("Community not found")
    return community


async def _mod_community(db: AsyncSession, community_id: uuid.UUID, user: User) -> Community:
    community = await _community(db, community_id)
    await moderation.require_moderator(db, community, user)
    return community


def _settings(community: Community) -> dict[str, int | bool]:
    return {
        "slow_mode_seconds": community.slow_mode_seconds,
        "followers_only": community.followers_only,
    }


@router.get("/chat-state")
async def chat_state(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
) -> dict:
    """Everything a chat needs besides the messages: settings, pin, poll and emotes. Public."""
    community = await _community(db, community_id)
    poll = await polls.current(db, community.id)
    return {
        "settings": _settings(community),
        "pinned": await pins.pinned_payload(db, community),
        "poll": await polls.state(db, poll, viewer.id if viewer else None) if poll else None,
        "emotes": [
            {"name": e.name, "url": emotes_service.public_url(e)}
            for e in await emotes_service.list_emotes(db, community.id)
        ],
    }


@router.put("/chat-settings")
async def put_chat_settings(
    community_id: uuid.UUID,
    body: ChatSettingsIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    community = await _mod_community(db, community_id, current_user)
    community = await moderation.set_chat_settings(
        db, community, current_user, body.slow_mode_seconds, body.followers_only
    )
    channel = chat_channel(community.id)
    await manager.broadcast(channel, outgoing("chat_settings", channel, _settings(community)))
    return _settings(community)


@router.post("/pin", status_code=204)
async def pin_message(
    community_id: uuid.UUID,
    body: PinIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    community = await _mod_community(db, community_id, current_user)
    message = await db.get(Message, body.message_id)
    if message is None:
        raise NotFoundException("Message not found")
    await pins.pin(db, community, current_user, message)


@router.delete("/pin", status_code=204)
async def unpin_message(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    community = await _mod_community(db, community_id, current_user)
    await pins.unpin(db, community, current_user)


# ── Timeouts and bans ─────────────────────────────────────────────────
@router.get("/bans", response_model=list[BanOut])
async def list_bans(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[BanOut]:
    await _mod_community(db, community_id, current_user)
    return [
        BanOut(
            id=b.id,
            user_id=u.id,
            username=u.username,
            display_name=u.display_name,
            reason=b.reason,
            expires_at=b.expires_at,
            created_at=b.created_at,
        )
        for b, u in await moderation.list_active_bans(db, community_id)
    ]


@router.post("/bans", response_model=BanOut, status_code=201)
async def create_ban(
    community_id: uuid.UUID,
    body: BanIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BanOut:
    community = await _mod_community(db, community_id, current_user)
    target = await db.get(User, body.user_id)
    if target is None:
        raise NotFoundException("User not found")
    ban = await moderation.ban_user(db, community, current_user, target, body.minutes, body.reason)
    channel = f"user/{target.id}"
    await manager.broadcast(
        channel,
        outgoing(
            "moderation",
            channel,
            {
                "community_id": str(community.id),
                "action": "timeout" if body.minutes else "ban",
                "expires_at": ban.expires_at.isoformat() if ban.expires_at else None,
            },
        ),
    )
    return BanOut(
        id=ban.id,
        user_id=target.id,
        username=target.username,
        display_name=target.display_name,
        reason=ban.reason,
        expires_at=ban.expires_at,
        created_at=ban.created_at,
    )


@router.delete("/bans/{ban_id}", status_code=204)
async def lift_ban(
    community_id: uuid.UUID,
    ban_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    community = await _mod_community(db, community_id, current_user)
    target = await moderation.lift(db, community, current_user, ban_id)
    channel = f"user/{target.id}"
    await manager.broadcast(
        channel,
        outgoing(
            "moderation",
            channel,
            {"community_id": str(community.id), "action": "lift", "expires_at": None},
        ),
    )


@router.get("/mod-actions", response_model=list[ModActionOut])
async def mod_actions(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ModActionOut]:
    await _mod_community(db, community_id, current_user)
    return [
        ModActionOut(
            id=a.id,
            action=a.action,
            actor=actor.username if actor else None,
            target=target.username if target else None,
            detail=a.detail,
            created_at=a.created_at,
        )
        for a, actor, target in await moderation.recent_actions(db, community_id)
    ]
