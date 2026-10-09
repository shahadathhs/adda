"""Direct messages: threads between two users, their messages, and blocks.

Privacy rule: DMs are private by design — no admin surface reads them.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base


class DmThread(Base):
    """A 1:1 conversation. Members are stored in canonical order
    (user_a_id < user_b_id as UUID strings) so the pair is unique."""

    __tablename__ = "dm_threads"
    __table_args__ = (UniqueConstraint("user_a_id", "user_b_id", name="uq_dm_thread_pair"),)

    user_a_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    user_b_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    # Per-user read cursors — messages with id > cursor are unread.
    read_a_id: Mapped[uuid.UUID | None] = mapped_column(default=None)
    read_b_id: Mapped[uuid.UUID | None] = mapped_column(default=None)
    last_message_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    messages = relationship(
        "DmMessage",
        back_populates="thread",
        cascade="all, delete-orphan",
        order_by="DmMessage.created_at",
    )


class DmMessage(Base):
    __tablename__ = "dm_messages"
    __table_args__ = (Index("ix_dm_messages_thread_created", "thread_id", "created_at"),)

    thread_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("dm_threads.id", ondelete="CASCADE"),
        index=True,
    )
    sender_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
    )
    content: Mapped[str] = mapped_column(String(2000))

    thread = relationship("DmThread", back_populates="messages")


class UserBlock(Base):
    """blocker refuses DMs from blocked. Symmetric enforcement: a blocked
    pair can never open or message a thread in either direction."""

    __tablename__ = "user_blocks"
    __table_args__ = (UniqueConstraint("blocker_id", "blocked_id", name="uq_user_block_pair"),)

    blocker_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    blocked_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
