from fastapi import HTTPException, Depends, status
from sqlalchemy.orm import Session
from datetime import datetime

from backend.database.database import get_db
from backend.app.models.upcoming_presentation.upcoming_presentation import UpcomingPresentation
from backend.app.utils.token_handler import TokenHandler
from backend.app.models.user.user import User


class CreateUpcomingPresentation:
    """
    Controller for creating upcoming presentations.
    """
    @staticmethod
    async def create_upcoming_presentation(
        topic: str,
        presentation_date: datetime,
        current_user: User = Depends(TokenHandler.get_current_user),
        db: Session = Depends(get_db)
    ):
        """
        Create a new upcoming presentation
        
        Args:
            topic: The topic of the presentation
            presentation_date: The date when the presentation will be held
            current_user: Authenticated user
            db: Database session
            
        Returns:
            dict: Created upcoming presentation information
            
        Raises:
            HTTPException: If creation fails
        """
        # Validate that the presentation date is in the future
        if presentation_date <= datetime.now():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Presentation date must be in the future"
            )
        
        # Validate topic is not empty
        if not topic or not topic.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Topic cannot be empty"
            )
        
        # Create the upcoming presentation
        upcoming_presentation = UpcomingPresentation(
            user_id=current_user.id,
            topic=topic.strip(),
            presentation_date=presentation_date
        )
        
        try:
            db.add(upcoming_presentation)
            db.commit()
            db.refresh(upcoming_presentation)
            
            return {
                "message": "Upcoming presentation created successfully",
                "upcoming_presentation": {
                    "id": upcoming_presentation.id,
                    "topic": upcoming_presentation.topic,
                    "presentation_date": upcoming_presentation.presentation_date,
                    "created_at": upcoming_presentation.created_at
                }
            }
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create upcoming presentation"
            ) 