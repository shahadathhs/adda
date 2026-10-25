"""add follows table and communities.stream_title

Revision ID: b7e2c5a9d3f1
Revises: a1c3f8e92b47
Create Date: 2026-10-01 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'b7e2c5a9d3f1'
down_revision: Union[str, None] = 'a1c3f8e92b47'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'follows',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('community_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['community_id'], ['communities.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'community_id', name='uq_follow_user_community'),
    )
    op.create_index('ix_follows_user_id', 'follows', ['user_id'])
    op.create_index('ix_follows_community_id', 'follows', ['community_id'])
    op.add_column('communities', sa.Column('stream_title', sa.String(length=200), nullable=True))


def downgrade() -> None:
    op.drop_column('communities', 'stream_title')
    op.drop_index('ix_follows_community_id', table_name='follows')
    op.drop_index('ix_follows_user_id', table_name='follows')
    op.drop_table('follows')
