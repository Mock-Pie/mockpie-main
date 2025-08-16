from backend.database.database import Base
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

class UpcomingPresentation(Base):
    __tablename__ = "upcoming_presentations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    topic = Column(String(length=255), nullable=False)
    presentation_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime, nullable=True)
        
    # Establish the relationship with the User model
    user = relationship("User", back_populates="upcoming_presentations") 