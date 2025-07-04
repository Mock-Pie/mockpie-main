from fastapi import HTTPException, Depends, status
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.app.utils.token_handler import TokenHandler
from backend.app.models.user.user import User
from backend.app.crud.upcoming_presentation import *
from backend.app.static.lang.error_messages.exception_responses import ErrorMessage


class DeleteUpcomingPresentation:
    @staticmethod
    async def delete_upcoming_presentation(
        presentation_id: int,
        current_user: User = Depends(TokenHandler.get_current_user),
        db: Session = Depends(get_db)
    ):
        """
        Soft delete an upcoming presentation by setting deleted_at timestamp.
        
        Args:
            presentation_id: ID of the upcoming presentation to delete
            current_user: Authenticated user
            db: Database session
            
        Returns:
            dict: Deletion confirmation message
            
        Raises:
            HTTPException: If presentation not found or access denied
        """
        # Find the upcoming presentation
        upcoming_presentation = get_upcoming_presentation_by_id(db, presentation_id, current_user.id)
        
        if not upcoming_presentation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=ErrorMessage.UPCOMING_PRESENTATION_NOT_FOUND.value
            )
        
        delete_upcoming_presentation(db, upcoming_presentation)
                    
        return {
            "message": "Upcoming presentation deleted successfully",
        }

