from sqlalchemy import Column, Integer, Float, String, ForeignKey
from sqlalchemy.orm import relationship
from backend.database.database import Base
from .base_analysis import BaseAnalysis

class VoiceAnalysis(BaseAnalysis):
    __tablename__ = "voice_analyses" # don't change this, it's used in the segments model
    
    # Global metrics
    wpm = Column(Float, nullable=True)
    avg_pitch = Column(Float, nullable=True)
    avg_volume = Column(Float, nullable=True)
    clarity_score = Column(Float, nullable=True)
    stutter_count = Column(Integer, nullable=True)
    
    # Relationships
    presentation = relationship("Presentation", back_populates="voice_analysis")
    segments = relationship("VoiceSegment", back_populates="analysis", cascade="all, delete-orphan")