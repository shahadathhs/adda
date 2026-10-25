"""user status

Revision ID: b4e7d9f1a3c5
Revises: a3d6c8e0b2f4
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b4e7d9f1a3c5"
down_revision: Union[str, None] = "a3d6c8e0b2f4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("status_emoji", sa.String(16), nullable=True))
    op.add_column("users", sa.Column("status_text", sa.String(80), nullable=True))
    op.add_column("users", sa.Column("status_expires_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "status_expires_at")
    op.drop_column("users", "status_text")
    op.drop_column("users", "status_emoji")
