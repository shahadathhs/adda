import uuid

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base


class Follow(Base):
    """A user following a community (its channel) for live notifications."""

    __tablename__ = "follows"
    __table_args__ = (UniqueConstraint("user_id", "community_id", name="uq_follow_user_community"),)

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    community_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("communities.id", ondelete="CASCADE"),
        index=True,
    )

    user = relationship("User")
    community = relationship("Community")
