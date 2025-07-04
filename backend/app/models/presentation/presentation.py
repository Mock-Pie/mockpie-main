from backend.database.database import Base
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

class Presentation(Base):
    __tablename__ = "presentations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    url = Column(String, nullable=False)
    language = Column(String(length=50), nullable=True)
    topic = Column(String(length=255), nullable=True)
    is_public = Column(Boolean, nullable=False, server_default=text('false'))  # Default value is false, indicating the presentation is private
    uploaded_at = Column(DateTime, server_default=func.now(), nullable=False)
    deleted_at = Column(DateTime, nullable=True)
        
    # Establish the relationship with the User model
    user = relationship("User", back_populates="presentations")
    
    # Feedback relationship
    feedback = relationship("Feedback", back_populates="presentation", uselist=False)