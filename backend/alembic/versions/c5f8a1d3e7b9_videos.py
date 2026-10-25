"""uploaded videos

Revision ID: c5f8a1d3e7b9
Revises: b4e7d9f1a3c5
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c5f8a1d3e7b9"
down_revision: Union[str, None] = "b4e7d9f1a3c5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "videos",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("community_id", sa.Uuid(), nullable=False),
        sa.Column("uploader_id", sa.Uuid(), nullable=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.String(2000), nullable=True),
        sa.Column("status", sa.String(12), server_default=sa.text("'uploading'"), nullable=False),
        sa.Column("visibility", sa.String(10), server_default=sa.text("'public'"), nullable=False),
        sa.Column("original_name", sa.String(255), nullable=False),
        sa.Column("size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("received_bytes", sa.BigInteger(), server_default=sa.text("0"), nullable=False),
        sa.Column("file_name", sa.String(32), nullable=True),
        sa.Column("duration_seconds", sa.Float(), nullable=True),
        sa.Column("width", sa.Integer(), nullable=True),
        sa.Column("height", sa.Integer(), nullable=True),
        sa.Column("video_codec", sa.String(24), nullable=True),
        sa.Column("audio_codec", sa.String(24), nullable=True),
        sa.Column("error", sa.String(300), nullable=True),
        sa.ForeignKeyConstraint(["community_id"], ["communities.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["uploader_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_videos_community_id"), "videos", ["community_id"])
    op.create_index(op.f("ix_videos_status"), "videos", ["status"])


def downgrade() -> None:
    op.drop_index(op.f("ix_videos_status"), table_name="videos")
    op.drop_index(op.f("ix_videos_community_id"), table_name="videos")
    op.drop_table("videos")
