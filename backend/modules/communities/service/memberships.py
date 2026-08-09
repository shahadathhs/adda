import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.join_request import JoinRequest
from models.membership import CommunityRole, Membership


# ── Membership CRUD ───────────────────────────────────────────────────
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


async def update_member_role(db: AsyncSession, membership: Membership, role: str) -> Membership:
    membership.role = CommunityRole(role)
    await db.commit()
    await db.refresh(membership)
    return membership


# ── Join requests (private communities) ───────────────────────────────
async def create_join_request(
    db: AsyncSession, community_id: uuid.UUID, user_id: uuid.UUID
) -> JoinRequest:
    request = JoinRequest(community_id=community_id, user_id=user_id)
    db.add(request)
    await db.commit()
    await db.refresh(request)
    return request


async def has_pending_request(
    db: AsyncSession, community_id: uuid.UUID, user_id: uuid.UUID
) -> bool:
    result = await db.execute(
        select(JoinRequest).where(
            JoinRequest.community_id == community_id,
            JoinRequest.user_id == user_id,
            JoinRequest.status == "pending",
        )
    )
    return result.scalar_one_or_none() is not None


async def list_pending_join_requests(
    db: AsyncSession, community_id: uuid.UUID
) -> list[JoinRequest]:
    result = await db.execute(
        select(JoinRequest)
        .where(
            JoinRequest.community_id == community_id,
            JoinRequest.status == "pending",
        )
        .order_by(JoinRequest.created_at.desc())
    )
    return list(result.scalars().all())


async def get_join_request(db: AsyncSession, request_id: uuid.UUID) -> JoinRequest | None:
    result = await db.execute(select(JoinRequest).where(JoinRequest.id == request_id))
    return result.scalar_one_or_none()


async def approve_join_request(db: AsyncSession, request: JoinRequest) -> Membership:
    request.status = "approved"
    membership = Membership(
        user_id=request.user_id,
        community_id=request.community_id,
        role=CommunityRole.member,
    )
    db.add(membership)
    await db.commit()
    await db.refresh(membership)
    return membership


async def deny_join_request(db: AsyncSession, request: JoinRequest) -> None:
    request.status = "denied"
    await db.commit()
