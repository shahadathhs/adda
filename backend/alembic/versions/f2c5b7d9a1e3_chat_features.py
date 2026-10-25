"""chat features: mentions, reactions, emotes, polls, bans, chat settings

Revision ID: f2c5b7d9a1e3
Revises: e1b4a8c3d5f2
Create Date: 2026-10-25 12:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f2c5b7d9a1e3"
down_revision: Union[str, None] = "e1b4a8c3d5f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _base() -> list[sa.Column]:
    return [
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    ]


def upgrade() -> None:
    op.add_column("communities", sa.Column("slow_mode_seconds", sa.Integer(), server_default=sa.text("0"), nullable=False))
    op.add_column("communities", sa.Column("followers_only", sa.Boolean(), server_default=sa.text("false"), nullable=False))
    op.add_column("communities", sa.Column("pinned_message_id", sa.Uuid(), nullable=True))
    op.create_foreign_key(
        "fk_community_pinned", "communities", "messages", ["pinned_message_id"], ["id"], ondelete="SET NULL"
    )

    op.create_table(
        "message_mentions",
        sa.Column("message_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        *_base(),
        sa.ForeignKeyConstraint(["message_id"], ["messages.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("message_id", "user_id", name="uq_mention_message_user"),
    )
    op.create_index(op.f("ix_message_mentions_message_id"), "message_mentions", ["message_id"])
    op.create_index(op.f("ix_message_mentions_user_id"), "message_mentions", ["user_id"])

    op.create_table(
        "message_reactions",
        sa.Column("message_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("emoji", sa.String(16), nullable=False),
        *_base(),
        sa.ForeignKeyConstraint(["message_id"], ["messages.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("message_id", "user_id", "emoji", name="uq_reaction_message_user_emoji"),
    )
    op.create_index(op.f("ix_message_reactions_message_id"), "message_reactions", ["message_id"])
    op.create_index(op.f("ix_message_reactions_user_id"), "message_reactions", ["user_id"])

    op.create_table(
        "emotes",
        sa.Column("community_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(24), nullable=False),
        sa.Column("file_key", sa.String(64), nullable=False),
        sa.Column("created_by_id", sa.Uuid(), nullable=True),
        *_base(),
        sa.ForeignKeyConstraint(["community_id"], ["communities.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("community_id", "name", name="uq_emote_community_name"),
    )
    op.create_index(op.f("ix_emotes_community_id"), "emotes", ["community_id"])

    op.create_table(
        "polls",
        sa.Column("community_id", sa.Uuid(), nullable=False),
        sa.Column("question", sa.String(200), nullable=False),
        sa.Column("created_by_id", sa.Uuid(), nullable=True),
        sa.Column("closes_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(10), server_default=sa.text("'open'"), nullable=False),
        *_base(),
        sa.ForeignKeyConstraint(["community_id"], ["communities.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_polls_community_id"), "polls", ["community_id"])
    op.create_index(
        "uq_polls_one_open_per_community",
        "polls",
        ["community_id"],
        unique=True,
        postgresql_where=sa.text("status = 'open'"),
    )

    op.create_table(
        "poll_options",
        sa.Column("poll_id", sa.Uuid(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("label", sa.String(80), nullable=False),
        sa.Column("votes", sa.Integer(), server_default=sa.text("0"), nullable=False),
        *_base(),
        sa.ForeignKeyConstraint(["poll_id"], ["polls.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_poll_options_poll_id"), "poll_options", ["poll_id"])

    op.create_table(
        "poll_votes",
        sa.Column("poll_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("option_id", sa.Uuid(), nullable=False),
        *_base(),
        sa.ForeignKeyConstraint(["poll_id"], ["polls.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["option_id"], ["poll_options.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("poll_id", "user_id", name="uq_poll_vote_poll_user"),
    )
    op.create_index(op.f("ix_poll_votes_poll_id"), "poll_votes", ["poll_id"])
    op.create_index(op.f("ix_poll_votes_user_id"), "poll_votes", ["user_id"])

    op.create_table(
        "channel_bans",
        sa.Column("community_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reason", sa.String(200), nullable=True),
        sa.Column("created_by_id", sa.Uuid(), nullable=True),
        *_base(),
        sa.ForeignKeyConstraint(["community_id"], ["communities.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_channel_bans_community_id"), "channel_bans", ["community_id"])
    op.create_index(op.f("ix_channel_bans_user_id"), "channel_bans", ["user_id"])


def downgrade() -> None:
    for table in ("channel_bans", "poll_votes", "poll_options", "polls", "emotes", "message_reactions", "message_mentions"):
        op.drop_table(table)
    op.drop_constraint("fk_community_pinned", "communities", type_="foreignkey")
    for col in ("pinned_message_id", "followers_only", "slow_mode_seconds"):
        op.drop_column("communities", col)
