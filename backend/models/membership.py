import enum
import uuid

from sqlalchemy import Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base


class CommunityRole(str, enum.Enum):
    owner = "owner"
    admin = "admin"
    moderator = "moderator"
    streamer = "streamer"
    member = "member"
    guest = "guest"


class Membership(Base):
    __tablename__ = "memberships"
    __table_args__ = (
        UniqueConstraint("user_id", "community_id", name="uq_membership_user_community"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    community_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("communities.id", ondelete="CASCADE"),
        index=True,
    )
    role: Mapped[CommunityRole] = mapped_column(
        Enum(CommunityRole, name="community_role"),
        default=CommunityRole.member,
    )

    user = relationship("User")
    community = relationship("Community", back_populates="members")

    def to_public_dict(self) -> dict[str, str]:
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "community_id": str(self.community_id),
            "role": self.role.value,
        }
