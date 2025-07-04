from fastapi import HTTPException, Depends, status
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.app.utils.token_handler import TokenHandler
from backend.app.models.user.user import User
from backend.app.crud.presentation import *
from backend.app.static.lang.error_messages.exception_responses import ErrorMessage


class ToggleVisibility:
    """
    Controller for toggling the visibility of a presentation.
    """
    @staticmethod
    async def toggle_visibility(
        presentation_id: str,
        current_user: User = Depends(TokenHandler.get_current_user),
        db: Session = Depends(get_db)):
    
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
        
        # Toggle the is_public field
        toggle_presentation_visibility(db=db, presentation=presentation)
        
        return {
            "message": f"Presentation visibility updated successfully",
            "presentation_id": presentation.id,
            "is_public": presentation.is_public
        }