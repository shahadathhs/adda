"""channel moderators; messages keyed by channel; drop text rooms and memberships

The v1 model is one chat per streamer channel (the `communities` row). Text
rooms (`channels`, `channel_members`), `memberships` and `join_requests` are
removed; moderators get their own small table.

Revision ID: d9a3f1c2b7e4
Revises: c4d8e1a7b2f6
Create Date: 2026-10-24 18:30:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d9a3f1c2b7e4"
down_revision: Union[str, None] = "c4d8e1a7b2f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── moderators (carry over admins and moderators from memberships) ──
    op.create_table(
        "channel_moderators",
        sa.Column("community_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["community_id"], ["communities.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("community_id", "user_id", name="uq_channel_moderator_community_user"),
    )
    op.create_index(op.f("ix_channel_moderators_community_id"), "channel_moderators", ["community_id"])
    op.create_index(op.f("ix_channel_moderators_user_id"), "channel_moderators", ["user_id"])
    op.execute(
        """
        INSERT INTO channel_moderators (id, community_id, user_id)
        SELECT gen_random_uuid(), m.community_id, m.user_id
        FROM memberships m
        JOIN communities c ON c.id = m.community_id
        WHERE m.role IN ('admin', 'moderator') AND m.user_id <> c.owner_id
        """
    )

    # ── messages: key by community instead of text room ────────────────
    op.add_column("messages", sa.Column("community_id", sa.Uuid(), nullable=True))
    op.add_column("messages", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("messages", sa.Column("deleted_by_id", sa.Uuid(), nullable=True))
    op.execute(
        "UPDATE messages SET community_id = channels.community_id "
        "FROM channels WHERE channels.id = messages.channel_id"
    )
    op.execute("DELETE FROM messages WHERE community_id IS NULL")
    # Long messages from the old 2000-char limit are cut to the new 300.
    op.execute("UPDATE messages SET content = left(content, 300) WHERE length(content) > 300")
    op.alter_column("messages", "community_id", nullable=False)
    op.alter_column("messages", "content", type_=sa.String(300), existing_type=sa.String(2000))
    op.drop_index(op.f("ix_messages_channel_id"), table_name="messages")
    op.drop_constraint("messages_channel_id_fkey", "messages", type_="foreignkey")
    op.drop_column("messages", "channel_id")
    op.drop_column("messages", "edited_at")
    op.create_foreign_key(
        "messages_community_id_fkey", "messages", "communities", ["community_id"], ["id"], ondelete="CASCADE"
    )
    op.create_foreign_key(
        "messages_deleted_by_id_fkey", "messages", "users", ["deleted_by_id"], ["id"], ondelete="SET NULL"
    )
    op.create_index(op.f("ix_messages_community_id"), "messages", ["community_id"])
    op.create_index("ix_messages_community_created", "messages", ["community_id", "created_at", "id"])
    # A reply outlives its parent (shown as "message deleted").
    op.drop_constraint("messages_reply_to_id_fkey", "messages", type_="foreignkey")
    op.create_foreign_key(
        "messages_reply_to_id_fkey", "messages", "messages", ["reply_to_id"], ["id"], ondelete="SET NULL"
    )

    # ── drop the old surface ───────────────────────────────────────────
    op.drop_table("channel_members")
    op.drop_table("channels")
    op.drop_table("join_requests")
    op.drop_table("memberships")
    op.execute("DROP TYPE IF EXISTS community_role")


def downgrade() -> None:
    raise NotImplementedError(
        "This migration removes text rooms, memberships and join requests; restore from a backup."
    )
