from sqlalchemy import Column, Float, String
from sqlalchemy.orm import relationship
from ...database import Base
from .base_segment import BaseSegment

class BodySegment(Base, BaseSegment):
    __tablename__ = "body_segments"
    
    # TODO: Think about more fields
    bad_pose = Column(String, nullable=False)

    
    # Relationship
    analysis = relationship("BodyAnalysis", back_populates="segments")