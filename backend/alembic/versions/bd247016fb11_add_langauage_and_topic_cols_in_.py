"""add_langauage_and_topic_cols_in_presentations

Revision ID: bd247016fb11
Revises: fa1296f3c398
Create Date: 2025-06-27 20:31:07.489707

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bd247016fb11'
down_revision: Union[str, None] = 'fa1296f3c398'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add language and topic columns to presentations table
    op.add_column('presentations', sa.Column('language', sa.String(length=50), nullable=True))
    op.add_column('presentations', sa.Column('topic', sa.String(length=255), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove language and topic columns from presentations table
    op.drop_column('presentations', 'topic')
    op.drop_column('presentations', 'language')
