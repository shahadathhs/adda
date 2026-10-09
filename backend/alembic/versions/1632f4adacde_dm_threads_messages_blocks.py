"""dm threads messages blocks

Revision ID: 1632f4adacde
Revises: f7cac4c4b483
Create Date: 2026-10-09 12:20:11.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '1632f4adacde'
down_revision: Union[str, None] = 'f7cac4c4b483'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'dm_threads',
        sa.Column('user_a_id', sa.Uuid(), nullable=False),
        sa.Column('user_b_id', sa.Uuid(), nullable=False),
        sa.Column('read_a_id', sa.Uuid(), nullable=True),
        sa.Column('read_b_id', sa.Uuid(), nullable=True),
        sa.Column('last_message_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column(
            'created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            'updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(['user_a_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_b_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_a_id', 'user_b_id', name='uq_dm_thread_pair'),
    )
    op.create_index(op.f('ix_dm_threads_user_a_id'), 'dm_threads', ['user_a_id'])
    op.create_index(op.f('ix_dm_threads_user_b_id'), 'dm_threads', ['user_b_id'])
    op.create_index(op.f('ix_dm_threads_last_message_at'), 'dm_threads', ['last_message_at'])

    op.create_table(
        'dm_messages',
        sa.Column('thread_id', sa.Uuid(), nullable=False),
        sa.Column('sender_id', sa.Uuid(), nullable=False),
        sa.Column('content', sa.String(length=2000), nullable=False),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column(
            'created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            'updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(['thread_id'], ['dm_threads.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        'ix_dm_messages_thread_created', 'dm_messages', ['thread_id', 'created_at']
    )
    op.create_index(op.f('ix_dm_messages_thread_id'), 'dm_messages', ['thread_id'])

    op.create_table(
        'user_blocks',
        sa.Column('blocker_id', sa.Uuid(), nullable=False),
        sa.Column('blocked_id', sa.Uuid(), nullable=False),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column(
            'created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            'updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(['blocker_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['blocked_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('blocker_id', 'blocked_id', name='uq_user_block_pair'),
    )
    op.create_index(op.f('ix_user_blocks_blocker_id'), 'user_blocks', ['blocker_id'])
    op.create_index(op.f('ix_user_blocks_blocked_id'), 'user_blocks', ['blocked_id'])


def downgrade() -> None:
    op.drop_index(op.f('ix_user_blocks_blocked_id'), table_name='user_blocks')
    op.drop_index(op.f('ix_user_blocks_blocker_id'), table_name='user_blocks')
    op.drop_table('user_blocks')
    op.drop_index(op.f('ix_dm_messages_thread_id'), table_name='dm_messages')
    op.drop_index('ix_dm_messages_thread_created', table_name='dm_messages')
    op.drop_table('dm_messages')
    op.drop_index(op.f('ix_dm_threads_last_message_at'), table_name='dm_threads')
    op.drop_index(op.f('ix_dm_threads_user_b_id'), table_name='dm_threads')
    op.drop_index(op.f('ix_dm_threads_user_a_id'), table_name='dm_threads')
    op.drop_table('dm_threads')
