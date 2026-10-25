"""notifications, announcements, recording comments, channel links

Revision ID: a3d6c8e0b2f4
Revises: f2c5b7d9a1e3
Create Date: 2026-10-25 13:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a3d6c8e0b2f4"
down_revision: Union[str, None] = "f2c5b7d9a1e3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _base() -> list[sa.Column]:
    return [
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    ]


def upgrade() -> None:
    op.add_column("communities", sa.Column("links", sa.JSON(), server_default=sa.text("'[]'"), nullable=False))

    op.create_table(
        "notifications",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("kind", sa.String(20), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        *_base(),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_notifications_user_id"), "notifications", ["user_id"])
    op.create_index("ix_notifications_user_created", "notifications", ["user_id", "created_at"])

    op.create_table(
        "notification_prefs",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("community_id", sa.Uuid(), nullable=True),
        sa.Column("bell", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("email", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        *_base(),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["community_id"], ["communities.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_notification_prefs_user_id"), "notification_prefs", ["user_id"])
    op.create_index(
        "uq_notification_pref_user_community",
        "notification_prefs",
        ["user_id", "community_id"],
        unique=True,
        postgresql_where=sa.text("community_id IS NOT NULL"),
    )
    op.create_index(
        "uq_notification_pref_user_default",
        "notification_prefs",
        ["user_id"],
        unique=True,
        postgresql_where=sa.text("community_id IS NULL"),
    )

    op.create_table(
        "announcements",
        sa.Column("community_id", sa.Uuid(), nullable=False),
        sa.Column("body", sa.String(500), nullable=False),
        sa.Column("pinned", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_by_id", sa.Uuid(), nullable=True),
        *_base(),
        sa.ForeignKeyConstraint(["community_id"], ["communities.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_announcements_community_id"), "announcements", ["community_id"])

    op.create_table(
        "recording_comments",
        sa.Column("community_id", sa.Uuid(), nullable=False),
        sa.Column("recording_path", sa.String(512), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("at_seconds", sa.Float(), nullable=False),
        sa.Column("body", sa.String(300), nullable=False),
        sa.Column("display_mode", sa.String(10), server_default=sa.text("'named'"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        *_base(),
        sa.ForeignKeyConstraint(["community_id"], ["communities.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_recording_comments_community_id"), "recording_comments", ["community_id"])
    op.create_index(op.f("ix_recording_comments_user_id"), "recording_comments", ["user_id"])
    op.create_index("ix_recording_comments_path_at", "recording_comments", ["recording_path", "at_seconds"])


def downgrade() -> None:
    for table in ("recording_comments", "announcements", "notification_prefs", "notifications"):
        op.drop_table(table)
    op.drop_column("communities", "links")
