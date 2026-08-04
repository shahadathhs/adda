import uuid

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.community import Community, new_stream_key
from models.membership import CommunityRole, Membership
from schemas.community import CommunityCreate, CommunityUpdate


async def create_community(
    db: AsyncSession, data: CommunityCreate, owner_id: uuid.UUID
) -> Community:
    community = Community(
        name=data.name,
        slug=data.slug,
        description=data.description,
        banner_url=data.banner_url,
        avatar_url=data.avatar_url,
        is_private=data.is_private,
        owner_id=owner_id,
    )
    db.add(community)
    await db.flush()

    # Owner is automatically an owner-role member.
    db.add(
        Membership(
            user_id=owner_id,
            community_id=community.id,
            role=CommunityRole.owner,
        )
    )
    await db.commit()
    await db.refresh(community)
    return community


async def get_community(db: AsyncSession, community_id: uuid.UUID) -> Community | None:
    result = await db.execute(select(Community).where(Community.id == community_id))
    return result.scalar_one_or_none()


async def get_community_by_slug(db: AsyncSession, slug: str) -> Community | None:
    result = await db.execute(select(Community).where(Community.slug == slug))
    return result.scalar_one_or_none()


async def list_communities(db: AsyncSession, limit: int = 50, offset: int = 0) -> list[Community]:
    result = await db.execute(
        select(Community).order_by(Community.created_at.desc()).limit(limit).offset(offset)
    )
    return list(result.scalars().all())


async def update_community(
    db: AsyncSession, community: Community, data: CommunityUpdate
) -> Community:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(community, field, value)
    await db.commit()
    await db.refresh(community)
    return community


async def delete_community(db: AsyncSession, community: Community) -> None:
    await db.delete(community)
    await db.commit()


async def regenerate_stream_key(db: AsyncSession, community: Community) -> Community:
    """Rotate the key a streamer uses to authenticate OBS publishing."""
    community.stream_key = new_stream_key()
    await db.commit()
    await db.refresh(community)
    return community


async def count_members(db: AsyncSession, community_id: uuid.UUID) -> int:
    result = await db.execute(
        select(func.count()).select_from(Membership).where(
            Membership.community_id == community_id
        )
    )
    return int(result.scalar() or 0)


async def get_member_role(
    db: AsyncSession, community_id: uuid.UUID, user_id: uuid.UUID
) -> CommunityRole | None:
    result = await db.execute(
        select(Membership.role).where(
            Membership.community_id == community_id, Membership.user_id == user_id
        )
    )
    return result.scalar_one_or_none()
