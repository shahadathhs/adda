from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Integer, String, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base

if TYPE_CHECKING:
    from models.message import Message


class Channel(Base):
    """A text/announcement channel within a community (Discord-style)."""

    __tablename__ = "channels"
    __table_args__ = (UniqueConstraint("community_id", "slug", name="uq_channel_community_slug"),)

    community_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("communities.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(50))
    slug: Mapped[str] = mapped_column(String(50))
    type: Mapped[str] = mapped_column(String(20), default="text")  # text, announcement, live
    position: Mapped[int] = mapped_column(Integer, default=0)
    # Restricted channels require explicit ChannelMember access. Default
    # channels (general, announcements, live) are open to all members.
    is_restricted: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=text("false")
    )

    messages: Mapped[list["Message"]] = relationship(
        "Message",
        back_populates="channel",
        cascade="all, delete-orphan",
        order_by="Message.created_at",
    )
