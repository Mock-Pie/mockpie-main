from sqlalchemy.orm import Session
from datetime import datetime

from backend.app.crud.user import *
from backend.app.crud.presentation import *
from backend.app.crud.feedback import *
from backend.app.crud.upcoming_presentation import *


class DeleteUser:
    @staticmethod
    async def delete_user(user_id: int, db: Session):
        """
        Soft delete a user and all their related data
        
        Args:
            user_id: The ID of the user to delete
            db: Database session
            
        Returns:
            dict: Status message
        """
        # Timestamp for deletion
        now = datetime.now()
        
        # First, mark all user's presentations as deleted
        presentations = get_presentations_by_user_id(db, user_id)
        
        # Mark each presentation as deleted and also mark associated analyses
        for presentation in presentations:
            # Soft delete feedback associated with the presentation
            feedback = get_feedback_by_presentation_id(db, presentation.id)
            feedback.deleted_at = now
            presentation.deleted_at = now
           
        # Soft delete all user's upcoming presentations
        upcoming_presentations = get_upcoming_presentation_by_id(db, user_id)
        
        for upcoming_presentation in upcoming_presentations:
            upcoming_presentation.deleted_at = now
        
        # Finally, mark the user as deleted
        user = get_user_by_id(db, user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=ErrorMessage.USER_NOT_FOUND.value
            )
        
        user.deleted_at = now
        
        try:
            db.commit()
            
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": f"Error deleting user: {str(e)}"}
        
        return {"status": "success", "message": "User and associated data have been deleted"}
