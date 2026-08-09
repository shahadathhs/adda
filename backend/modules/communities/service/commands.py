import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from models.channel import Channel
from models.community import Community
from models.membership import CommunityRole, Membership
from modules.communities.schemas import CommunityCreate, CommunityUpdate

DEFAULT_CHANNELS = [
    ("general", "General", "text", 0),
    ("announcements", "Announcements", "announcement", 1),
    ("live", "Live Chat", "text", 2),
]


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

    # Default channels (Discord-style).
    for slug, name, ctype, position in DEFAULT_CHANNELS:
        db.add(
            Channel(
                community_id=community.id,
                name=name,
                slug=slug,
                type=ctype,
                position=position,
            )
        )

    await db.commit()
    await db.refresh(community)
    return community


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
