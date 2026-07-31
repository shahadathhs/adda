import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from auth.deps import get_current_user
from communities.service import get_community
from database import get_db
from members.service import (
    get_membership,
    join_community,
    leave_community,
    list_members as list_members_service,
)
from models.user import User
from schemas.user import UserOut

router = APIRouter(prefix="/communities/{community_id}/members", tags=["members"])


@router.get("", response_model=list[UserOut])
@router.get("/", response_model=list[UserOut], include_in_schema=False)
async def list_members(community_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    memberships = await list_members_service(db, community_id)
    users: list[UserOut] = []
    for m in memberships:
        await db.refresh(m, attribute_names=["user"])
        if m.user is not None:
            users.append(UserOut.model_validate(m.user, from_attributes=True))
    return users


@router.post("", status_code=status.HTTP_201_CREATED, response_model=UserOut)
async def join(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    community = await get_community(db, community_id)
    if community is None:
        raise HTTPException(status_code=404, detail="Community not found")

    existing = await get_membership(db, community_id, current_user.id)
    if existing is not None:
        raise HTTPException(status_code=409, detail="Already a member")

    await join_community(db, community_id, current_user.id)
    return UserOut.model_validate(current_user, from_attributes=True)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def leave(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    membership = await get_membership(db, community_id, current_user.id)
    if membership is None:
        raise HTTPException(status_code=404, detail="Not a member")
    await leave_community(db, membership)
