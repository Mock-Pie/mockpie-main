from fastapi import HTTPException, Depends, status
from sqlalchemy.orm import Session

from datetime import datetime
from backend.database.database import get_db
from backend.app.utils.token_handler import TokenHandler
from backend.app.models.user.user import User
from backend.app.crud.upcoming_presentation import *
from backend.app.static.lang.error_messages.exception_responses import ErrorMessage

class EditUpcomingPresentation:
    @staticmethod
    async def edit_upcoming_presentation(
        presentation_id: int,
        topic: str,
        presentation_date: datetime,
        current_user: User = Depends(TokenHandler.get_current_user),
        db: Session = Depends(get_db)
    ):
        """
        Edit an existing upcoming presentation
        
        Args:
            presentation_id: ID of the upcoming presentation to edit
            topic: New topic for the presentation
            presentation_date: New date for the presentation
            current_user: Authenticated user
            db: Database session
            
        Returns:
            dict: Updated upcoming presentation information
            
        Raises:
            HTTPException: If update fails or validation errors occur
        """
        
        presentation = get_upcoming_presentation_by_id(
            db=db,
            presentation_id=presentation_id,
            current_user_id=current_user.id
        )
        
        if (not presentation) or (presentation.user_id != current_user.id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=ErrorMessage.UPCOMING_PRESENTATION_NOT_FOUND.value
            )
            
        if presentation_date:
            try:
                # Parse the date string to datetime
                parsed_date = datetime.fromisoformat(presentation_date.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid date format. Use ISO format: YYYY-MM-DDTHH:MM:SS"
                )

            # Validate that the presentation date is in the future
            if parsed_date <= datetime.now():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Presentation date must be in the future."
                )
                
            presentation.presentation_date = parsed_date

        # Validate topic is not empty
        if topic:
            presentation.topic = topic.strip()
            
        # Update the upcoming presentation
        updated_presentation = update_upcoming_presentation(
            db=db,
            presentation=presentation
        )

        return updated_presentation
        