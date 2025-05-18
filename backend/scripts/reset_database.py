import sys
import os
import logging

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import engine, Base
from app.models.user.user import User  # Import all models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    logger.info("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    logger.info("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database reset complete")

if __name__ == "__main__":
    confirm = input("This will delete all data in the database. Continue? (y/N): ")
    if confirm.lower() == 'y':
        main()
    else:
        print("Operation cancelled")