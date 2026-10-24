"""Poll REST: start, vote, end. Live updates go over the WebSocket."""

import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.exceptions import NotFoundException
from core.security.deps import get_current_user
from models.poll import Poll
from models.user import User
from modules.chat.service import moderation, polls
from modules.communities.service.queries import get_community

router = APIRouter(tags=["polls"])


class PollIn(BaseModel):
    question: str = Field(max_length=200)
    options: list[str] = Field(min_length=2, max_length=4)
    duration_seconds: int = 300


class VoteIn(BaseModel):
    option_id: uuid.UUID


@router.post("/communities/{community_id}/polls", status_code=201)
async def start_poll(
    community_id: uuid.UUID,
    body: PollIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    community = await get_community(db, community_id)
    if community is None:
        raise NotFoundException("Community not found")
    await moderation.require_moderator(db, community, current_user)
    poll = await polls.create(
        db, community, current_user, body.question, body.options, body.duration_seconds
    )
    return await polls.state(db, poll, current_user.id)


async def _poll(db: AsyncSession, poll_id: uuid.UUID) -> Poll:
    poll = await db.get(Poll, poll_id)
    if poll is None:
        raise NotFoundException("Poll not found")
    return poll


@router.post("/polls/{poll_id}/end", status_code=204)
async def end_poll(
    poll_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    poll = await _poll(db, poll_id)
    community = await get_community(db, poll.community_id)
    assert community is not None
    await moderation.require_moderator(db, community, current_user)
    await polls.end(db, poll, current_user)


@router.post("/polls/{poll_id}/vote", status_code=204)
async def vote(
    poll_id: uuid.UUID,
    body: VoteIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    await polls.vote(db, await _poll(db, poll_id), current_user, body.option_id)
