import uuid

from sqlalchemy import ForeignKey, String, text
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class Announcement(Base):
    """A post on a channel page. Pinned ones are listed first."""

    __tablename__ = "announcements"

    community_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("communities.id", ondelete="CASCADE"), index=True
    )
    body: Mapped[str] = mapped_column(String(500))
    pinned: Mapped[bool] = mapped_column(default=False, server_default=text("false"))
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
