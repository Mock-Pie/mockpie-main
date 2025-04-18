from sqlalchemy import Column, Integer, Float, String, ForeignKey
from sqlalchemy.orm import relationship
from ...database import Base
from .base_analysis import BaseAnalysis

class BodyAnalysis(Base, BaseAnalysis):
    __tablename__ = "body_analyses" # don't change this, it's used in the segments model
    
    # Global metrics
    posture_score = Column(Float, nullable=True)
    movement_score = Column(Float, nullable=True)
    eye_contact_score = Column(Float, nullable=True)
    gesture_count = Column(Integer, nullable=True)
    
    # Relationships
    presentation = relationship("Presentation", back_populates="body_analysis")
    segments = relationship("BodySegment", back_populates="analysis", cascade="all, delete-orphan")