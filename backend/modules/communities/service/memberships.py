import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.membership import CommunityRole, Membership


async def get_membership(
    db: AsyncSession, community_id: uuid.UUID, user_id: uuid.UUID
) -> Membership | None:
    result = await db.execute(
        select(Membership).where(
            Membership.community_id == community_id, Membership.user_id == user_id
        )
    )
    return result.scalar_one_or_none()


async def join_community(
    db: AsyncSession,
    community_id: uuid.UUID,
    user_id: uuid.UUID,
    role: CommunityRole = CommunityRole.member,
) -> Membership:
    membership = Membership(user_id=user_id, community_id=community_id, role=role)
    db.add(membership)
    await db.commit()
    await db.refresh(membership)
    return membership


async def leave_community(db: AsyncSession, membership: Membership) -> None:
    await db.delete(membership)
    await db.commit()


async def list_members(db: AsyncSession, community_id: uuid.UUID) -> list[Membership]:
    result = await db.execute(select(Membership).where(Membership.community_id == community_id))
    return list(result.scalars().all())
