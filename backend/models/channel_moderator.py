import uuid

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base


class ChannelModerator(Base):
    """A user the channel owner has made a moderator of that channel."""

    __tablename__ = "channel_moderators"
    __table_args__ = (
        UniqueConstraint("community_id", "user_id", name="uq_channel_moderator_community_user"),
    )

    community_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("communities.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    user = relationship("User")
