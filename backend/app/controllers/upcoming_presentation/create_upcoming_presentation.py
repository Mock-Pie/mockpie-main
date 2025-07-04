from fastapi import HTTPException, Depends, status
from sqlalchemy.orm import Session
from datetime import datetime

from backend.database.database import get_db
from backend.app.utils.token_handler import TokenHandler
from backend.app.models.user.user import User
from backend.app.static.lang.error_messages.exception_responses import ErrorMessage
from backend.app.crud.upcoming_presentation import *


class CreateUpcomingPresentation:
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
        
        try:
            # Parse the date string to datetime
            parsed_date = datetime.fromisoformat(presentation_date.replace('Z', '+00:00'))
            
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ErrorMessage.INVALID_DATE_FORMAT.value   
            )
        
        # Validate that the presentation date is in the future
        if parsed_date <= datetime.now():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ErrorMessage.INVALID_UPCOMING_PRESENTATION_DATE.value
            )
        
        # Validate topic is not empty
        if not topic or not topic.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ErrorMessage.TOPIC_EMPTY.value
            )
        
        # Create the upcoming presentation
        upcoming_presentation = create_upcoming_presentation(
            db=db,
            user_id=current_user.id,
            topic=topic.strip(),
            presentation_date=parsed_date
        )
        
        return {
            "message": "Upcoming presentation created successfully",
            "upcoming_presentation": {
                "id": upcoming_presentation.id,
                "topic": upcoming_presentation.topic,
                "presentation_date": upcoming_presentation.presentation_date,
                "created_at": upcoming_presentation.created_at
            }
        }