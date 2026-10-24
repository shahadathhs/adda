"""Timestamped comments on recordings (F16). Same identity rules as chat."""

import uuid
from datetime import UTC, datetime
from typing import Literal

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.exceptions import ForbiddenException, NotFoundException
from core.security.deps import get_current_user
from models.recording_comment import RecordingComment
from models.user import User
from modules.chat.service.identity import public_author
from modules.communities.service.queries import get_community
from modules.communities.service.roles import can_moderate
from modules.recordings.service.files import scan_recordings

router = APIRouter(prefix="/recordings/comments", tags=["recordings"])

MAX_AT_SECONDS = 60 * 60 * 48


class CommentIn(BaseModel):
    community_id: uuid.UUID
    path: str = Field(min_length=1, max_length=512)
    at_seconds: float = Field(ge=0, le=MAX_AT_SECONDS)
    body: str = Field(min_length=1, max_length=300)


def _wire(comment: RecordingComment, user: User) -> dict:
    return {
        "id": str(comment.id),
        "at_seconds": comment.at_seconds,
        "body": comment.body,
        "author": public_author(user, comment.display_mode, []),
        "created_at": comment.created_at.isoformat(),
    }


@router.get("")
async def list_comments(
    community_id: uuid.UUID,
    path: str,
    sort: Literal["time", "recent"] = Query("time"),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    """Public: anyone can read a recording's comments."""
    query = (
        select(RecordingComment, User)
        .join(User, RecordingComment.user_id == User.id)
        .where(
            RecordingComment.community_id == community_id,
            RecordingComment.recording_path == path,
            RecordingComment.deleted_at.is_(None),
        )
    )
    query = query.order_by(
        RecordingComment.at_seconds if sort == "time" else RecordingComment.created_at.desc()
    ).limit(500)
    return [_wire(c, u) for c, u in (await db.execute(query)).all()]


@router.post("", status_code=status.HTTP_201_CREATED)
async def add_comment(
    body: CommentIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    community = await get_community(db, body.community_id)
    if community is None:
        raise NotFoundException("Channel not found")
    if body.path not in {r["path"] for r in scan_recordings(str(community.id))}:
        raise NotFoundException("Recording not found")
    comment = RecordingComment(
        community_id=community.id,
        recording_path=body.path,
        user_id=current_user.id,
        at_seconds=body.at_seconds,
        body=body.body.strip(),
        display_mode=current_user.identity_mode,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return _wire(comment, current_user)


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    comment = await db.get(RecordingComment, comment_id)
    if comment is None or comment.deleted_at is not None:
        raise NotFoundException("Comment not found")
    if comment.user_id != current_user.id:
        community = await get_community(db, comment.community_id)
        if community is None or not await can_moderate(db, community, current_user):
            raise ForbiddenException("You can only delete your own comments")
    comment.deleted_at = datetime.now(UTC)
    await db.commit()
