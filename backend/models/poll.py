import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class Poll(Base):
    """A channel poll. At most one is open per channel."""

    __tablename__ = "polls"
    __table_args__ = (
        Index(
            "uq_polls_one_open_per_community",
            "community_id",
            unique=True,
            postgresql_where=text("status = 'open'"),
        ),
    )

    community_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("communities.id", ondelete="CASCADE"), index=True
    )
    question: Mapped[str] = mapped_column(String(200))
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    closes_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(10), default="open", server_default=text("'open'"))


class PollOption(Base):
    __tablename__ = "poll_options"

    poll_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("polls.id", ondelete="CASCADE"), index=True
    )
    position: Mapped[int] = mapped_column(Integer)
    label: Mapped[str] = mapped_column(String(80))
    # Final tally, written when the poll closes; live tallies are in Redis.
    votes: Mapped[int] = mapped_column(Integer, default=0, server_default=text("0"))


class PollVote(Base):
    __tablename__ = "poll_votes"
    __table_args__ = (UniqueConstraint("poll_id", "user_id", name="uq_poll_vote_poll_user"),)

    poll_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("polls.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    option_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("poll_options.id", ondelete="CASCADE"))
