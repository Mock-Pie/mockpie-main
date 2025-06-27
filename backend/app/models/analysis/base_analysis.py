from backend.database.database import Base
from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declared_attr

class BaseAnalysis(Base):
    """Abstract base class for analysis models"""
    
    __abstract__ = True  # This tells SQLAlchemy this is an abstract base class
    
    id = Column(Integer, primary_key=True, index=True)
    
    @declared_attr
    def presentation_id(cls):
        return Column(Integer, ForeignKey("presentations.id"), nullable=False, index=True)
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime, nullable=True)