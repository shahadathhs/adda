"""drop user google_id

Revision ID: f7cac4c4b483
Revises: b7e2c5a9d3f1
Create Date: 2026-10-09 11:38:01.714270

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f7cac4c4b483'
down_revision: Union[str, None] = 'b7e2c5a9d3f1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_index(op.f('ix_users_google_id'), table_name='users')
    op.drop_column('users', 'google_id')


def downgrade() -> None:
    op.add_column(
        'users',
        sa.Column('google_id', sa.String(length=255), nullable=True),
    )
    op.create_index(
        op.f('ix_users_google_id'), 'users', ['google_id'], unique=True
    )
