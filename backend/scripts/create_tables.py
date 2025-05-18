import sys
import os
import logging

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import engine, Base
from app.models.user.user import User  # This imports all your SQLAlchemy models
from app.models.presentation.presentation import Presentation  # Add this
from app.models.analysis.voice_analysis import VoiceAnalysis  # Add this
from app.models.segments import *  # Add this

from app.models.analysis.body_analysis import BodyAnalysis  # Add this
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")

if __name__ == "__main__":
    main()