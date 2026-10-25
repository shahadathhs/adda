import uuid

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class Emote(Base):
    """A custom channel emote, used in chat as `:name:`."""

    __tablename__ = "emotes"
    __table_args__ = (UniqueConstraint("community_id", "name", name="uq_emote_community_name"),)

    community_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("communities.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(24))
    # Generated file name under the emotes directory; the user-supplied name is only a lookup key.
    file_key: Mapped[str] = mapped_column(String(64))
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
