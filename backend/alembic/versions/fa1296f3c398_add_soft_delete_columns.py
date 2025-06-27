"""add_soft_delete_columns

Revision ID: fa1296f3c398
Revises: cbf9182b4991
Create Date: 2025-06-27 14:17:04.291029

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fa1296f3c398'
down_revision: Union[str, None] = 'cbf9182b4991'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add deleted_at column to users table
    op.add_column('users', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    
    # Add deleted_at column to presentations table
    op.add_column('presentations', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    
    # Add deleted_at column to voice_analyses table
    op.add_column('voice_analyses', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    
    # Add deleted_at column to body_analyses table
    op.add_column('body_analyses', sa.Column('deleted_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove deleted_at column from body_analyses table
    op.drop_column('body_analyses', 'deleted_at')
    
    # Remove deleted_at column from voice_analyses table
    op.drop_column('voice_analyses', 'deleted_at')
    
    # Remove deleted_at column from presentations table
    op.drop_column('presentations', 'deleted_at')
    
    # Remove deleted_at column from users table
    op.drop_column('users', 'deleted_at')
