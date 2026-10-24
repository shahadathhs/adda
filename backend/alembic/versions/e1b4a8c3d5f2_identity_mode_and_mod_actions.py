"""identity mode on users and messages; moderator audit table

Revision ID: e1b4a8c3d5f2
Revises: d9a3f1c2b7e4
Create Date: 2026-10-25 10:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e1b4a8c3d5f2"
down_revision: Union[str, None] = "d9a3f1c2b7e4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("identity_mode", sa.String(10), server_default=sa.text("'named'"), nullable=False),
    )
    op.add_column(
        "messages",
        sa.Column("display_mode", sa.String(10), server_default=sa.text("'named'"), nullable=False),
    )
    op.create_table(
        "mod_actions",
        sa.Column("community_id", sa.Uuid(), nullable=False),
        sa.Column("actor_id", sa.Uuid(), nullable=True),
        sa.Column("action", sa.String(30), nullable=False),
        sa.Column("target_user_id", sa.Uuid(), nullable=True),
        sa.Column("message_id", sa.Uuid(), nullable=True),
        sa.Column("detail", sa.String(300), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["community_id"], ["communities.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["actor_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["target_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["message_id"], ["messages.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_mod_actions_community_id"), "mod_actions", ["community_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_mod_actions_community_id"), table_name="mod_actions")
    op.drop_table("mod_actions")
    op.drop_column("messages", "display_mode")
    op.drop_column("users", "identity_mode")
