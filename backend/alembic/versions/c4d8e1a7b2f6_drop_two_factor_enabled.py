"""drop users.two_factor_enabled

Revision ID: c4d8e1a7b2f6
Revises: f7cac4c4b483
Create Date: 2026-10-24 12:30:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c4d8e1a7b2f6"
down_revision: Union[str, None] = "f7cac4c4b483"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("users", "two_factor_enabled")


def downgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "two_factor_enabled",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
    )
