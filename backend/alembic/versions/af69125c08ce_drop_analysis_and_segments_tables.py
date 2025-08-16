"""drop_analysis_and_segments_tables

Revision ID: af69125c08ce
Revises: 97e2c21505b1
Create Date: 2025-07-03 16:18:00.918435

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'af69125c08ce'
down_revision: Union[str, None] = '97e2c21505b1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Drop analysis and segments tables."""
    # Drop segments tables first (they reference analysis tables)
    op.drop_index(op.f('ix_voice_segments_id'), table_name='voice_segments')
    op.drop_index(op.f('ix_voice_segments_analysis_id'), table_name='voice_segments')
    op.drop_table('voice_segments')
    
    op.drop_index(op.f('ix_body_segments_id'), table_name='body_segments')
    op.drop_index(op.f('ix_body_segments_analysis_id'), table_name='body_segments')
    op.drop_table('body_segments')
    
    # Drop analysis tables
    op.drop_index(op.f('ix_voice_analyses_presentation_id'), table_name='voice_analyses')
    op.drop_index(op.f('ix_voice_analyses_id'), table_name='voice_analyses')
    op.drop_table('voice_analyses')
    
    op.drop_index(op.f('ix_body_analyses_presentation_id'), table_name='body_analyses')
    op.drop_index(op.f('ix_body_analyses_id'), table_name='body_analyses')
    op.drop_table('body_analyses')


def downgrade() -> None:
    """Recreate analysis and segments tables."""
    # Recreate analysis tables first
    op.create_table('body_analyses',
    sa.Column('posture_score', sa.Float(), nullable=True),
    sa.Column('movement_score', sa.Float(), nullable=True),
    sa.Column('eye_contact_score', sa.Float(), nullable=True),
    sa.Column('gesture_count', sa.Integer(), nullable=True),
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('presentation_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['presentation_id'], ['presentations.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_body_analyses_id'), 'body_analyses', ['id'], unique=False)
    op.create_index(op.f('ix_body_analyses_presentation_id'), 'body_analyses', ['presentation_id'], unique=False)
    
    op.create_table('voice_analyses',
    sa.Column('wpm', sa.Float(), nullable=True),
    sa.Column('avg_pitch', sa.Float(), nullable=True),
    sa.Column('avg_volume', sa.Float(), nullable=True),
    sa.Column('clarity_score', sa.Float(), nullable=True),
    sa.Column('stutter_count', sa.Integer(), nullable=True),
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('presentation_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['presentation_id'], ['presentations.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_voice_analyses_id'), 'voice_analyses', ['id'], unique=False)
    op.create_index(op.f('ix_voice_analyses_presentation_id'), 'voice_analyses', ['presentation_id'], unique=False)
    
    # Recreate segments tables
    op.create_table('body_segments',
    sa.Column('bad_pose', sa.String(), nullable=False),
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('start_time', sa.Float(), nullable=False),
    sa.Column('end_time', sa.Float(), nullable=False),
    sa.Column('analysis_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['analysis_id'], ['body_analyses.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_body_segments_analysis_id'), 'body_segments', ['analysis_id'], unique=False)
    op.create_index(op.f('ix_body_segments_id'), 'body_segments', ['id'], unique=False)
    
    op.create_table('voice_segments',
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('start_time', sa.Float(), nullable=False),
    sa.Column('end_time', sa.Float(), nullable=False),
    sa.Column('analysis_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['analysis_id'], ['voice_analyses.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_voice_segments_analysis_id'), 'voice_segments', ['analysis_id'], unique=False)
    op.create_index(op.f('ix_voice_segments_id'), 'voice_segments', ['id'], unique=False)
