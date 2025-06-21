from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from typing import Generator

from backend.config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

def init_db():
    """
    Initialize the database by creating all tables.
    
    This function should be called at the start of the application to ensure
    that all models are created in the database.
    """
    Base.metadata.create_all(bind=engine)

def get_db() -> Generator:
    """
    Dependency function that yields a SQLAlchemy database session.
    
    This creates a new database session for each request and ensures 
    it's properly closed when the request is complete, even if there's an exception.
    
    Yields:
        Session: SQLAlchemy database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()