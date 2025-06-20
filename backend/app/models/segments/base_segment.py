from backend.database.database import Base
from sqlalchemy import Column, Integer, Float
from sqlalchemy.ext.declarative import declared_attr

class BaseSegment(Base):
    """Abstract base class for all segment models"""
    
    __abstract__ = True  # This tells SQLAlchemy this is an abstract base class
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Common time properties for all segments
    start_time = Column(Float, nullable=False)
    end_time = Column(Float, nullable=False)
    
    # Common analysis_id relationship to be defined by subclasses
    @declared_attr
    def analysis_id(cls):
        from sqlalchemy import ForeignKey
        # Each subclass will define its own foreign key to the appropriate analysis table
        analysis_table = cls.__tablename__.replace('_segments', '_analyses')
        return Column(Integer, ForeignKey(f"{analysis_table}.id"), nullable=False, index=True)