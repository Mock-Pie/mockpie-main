from fastapi import HTTPException, Depends, status
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.app.utils.token_handler import TokenHandler
from backend.app.models.user.user import User
from backend.app.crud.feedback import *
from backend.app.crud.presentation import *
from backend.app.static.lang.error_messages.exception_responses import ErrorMessage


class DeletePresentation:
    @staticmethod
    async def delete_video(
        presentation_id: int,
        current_user: User = Depends(TokenHandler.get_current_user),
        db: Session = Depends(get_db)
    ):
        """
        Delete a presentation and its file
        
        Args:
            presentation_id: ID of the presentation
            current_user: Authenticated user
            db: Database session
            
        Returns:
            dict: Deletion confirmation
            
        Raises:
            HTTPException: If video not found or access denied
        """
        presentation = get_presentation_by_id(db, presentation_id, current_user)
        
        if not presentation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=ErrorMessage.VIDEO_NOT_FOUND.value
            )
            
        # delete associated feedback
        delete_feedback_by_presentation_id(db, presentation_id)
        
        # Delete the physical file
        delete_video_file(presentation=presentation)
        
        delete_presentation(db, presentation)
        
        return {
            "message": "Video deleted successfully",
            "presentation_id": presentation_id
        }