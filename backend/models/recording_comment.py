import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, String, text
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class RecordingComment(Base):
    """A comment at a position in a recording. The account is always recorded."""

    __tablename__ = "recording_comments"
    __table_args__ = (Index("ix_recording_comments_path_at", "recording_path", "at_seconds"),)

    community_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("communities.id", ondelete="CASCADE"), index=True
    )
    recording_path: Mapped[str] = mapped_column(String(512))
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    at_seconds: Mapped[float] = mapped_column(Float)
    body: Mapped[str] = mapped_column(String(300))
    display_mode: Mapped[str] = mapped_column(
        String(10), default="named", server_default=text("'named'")
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
