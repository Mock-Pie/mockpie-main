"""add_deleted_at_column_to_feedback_table

Revision ID: 97e2c21505b1
Revises: 49ef7ec6fff3
Create Date: 2025-07-03 03:11:17.746578

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '97e2c21505b1'
down_revision: Union[str, None] = '49ef7ec6fff3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add deleted_at column to feedback table for soft delete functionality
    op.add_column('feedback', sa.Column('deleted_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove deleted_at column from feedback table
    op.drop_column('feedback', 'deleted_at')
