from sqlalchemy import Column, Float, String, Text
from sqlalchemy.orm import relationship
from backend.database.database import Base
from .base_segment import BaseSegment

class VoiceSegment(BaseSegment):
    __tablename__ = "voice_segments"
    
    # TODO: Think about more fields
    status = Column(String, nullable=False)

    
    # Relationship
    analysis = relationship("VoiceAnalysis", back_populates="segments")