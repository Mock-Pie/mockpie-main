from backend.database.database import Base
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

class Presentation(Base):
    __tablename__ = "presentations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    url = Column(String, nullable=False)
    uploaded_at = Column(DateTime, server_default=func.now(), nullable=False)    # Establish the relationship with the User model
    user = relationship("User", back_populates="presentations")
    
    # Analysis relationships
    voice_analysis = relationship("VoiceAnalysis", back_populates="presentation", uselist=False)
    body_analysis = relationship("BodyAnalysis", back_populates="presentation", uselist=False)