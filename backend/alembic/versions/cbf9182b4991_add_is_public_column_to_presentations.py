"""add_is_public_column_to_presentations

Revision ID: cbf9182b4991
Revises: 5bd4cc743146
Create Date: 2025-06-26 13:40:57.400089

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cbf9182b4991'
down_revision: Union[str, None] = '5bd4cc743146'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add is_public column to presentations table with default value of false
    # Use lowercase_with_underscores naming convention for PostgreSQL compatibility
    op.add_column('presentations',
        sa.Column('is_public', sa.Boolean(), server_default=sa.text('false'), nullable=False)
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Remove is_public column from presentations table
    op.drop_column('presentations', 'is_public')
