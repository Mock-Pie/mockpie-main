from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.app.models.user.user import User
from backend.app.utils.token_handler import TokenHandler
from backend.app.crud.presentation import *
from backend.app.static.lang.error_messages.exception_responses import ErrorMessage


class GetPresentation:
    @staticmethod
    async def get_video_details(
        presentation_id: int,
        current_user: User = Depends(TokenHandler.get_current_user),
        db: Session = Depends(get_db)
    ):
        """
        Get details of a specific video
        
        Args:
            presentation_id: ID of the presentation
            current_user: Authenticated user
            db: Database session
            
        Returns:
            dict: Video details
            
        Raises:
            HTTPException: If video not found or access denied
        """
        presentation = get_presentation_by_id(
            db=db,
            presentation_id=presentation_id,
            current_user=current_user
        )
        
        if not presentation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=ErrorMessage.PRESENTATION_NOT_FOUND.value
            )
        
        # Get file info if file exists
        file_info = get_file_info(presentation)
        
        return {
            "id": presentation.id,
            "title": presentation.title,
            "url": presentation.url,
            "uploaded_at": presentation.uploaded_at.isoformat(),
            "file_info": file_info
        }