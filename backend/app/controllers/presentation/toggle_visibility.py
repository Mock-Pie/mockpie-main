from fastapi import HTTPException, Depends, Form, status, Body
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.app.models.presentation.presentation import Presentation
from backend.app.utils.token_handler import TokenHandler
from backend.app.models.user.user import User


class ToggleVisibility:
    """
    Controller for toggling the visibility of a presentation.
    """
    @staticmethod
    async def toggle_visibility(
        presentation_id: str,
        current_user: User = Depends(TokenHandler.get_current_user),
        db: Session = Depends(get_db)):
    
        presentation = db.query(Presentation).filter(
        Presentation.id == presentation_id,
        Presentation.user_id == current_user.id
    ).first()
    
        if not presentation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Presentation not found"
            )
        
        # Toggle the is_public field
        presentation.is_public = not presentation.is_public
        db.commit()
        db.refresh(presentation)
        
        return {
            "message": f"Presentation visibility updated successfully",
            "presentation_id": presentation.id,
            "is_public": presentation.is_public
        }