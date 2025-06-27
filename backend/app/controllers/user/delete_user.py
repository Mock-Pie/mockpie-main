from sqlalchemy.orm import Session
from datetime import datetime

from backend.app.models.user.user import User
from backend.app.models.presentation.presentation import Presentation
from backend.app.models.analysis.voice_analysis import VoiceAnalysis
from backend.app.models.analysis.body_analysis import BodyAnalysis


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
        presentations = db.query(Presentation).filter(
            Presentation.user_id == user_id,
            Presentation.deleted_at.is_(None)
        ).all()
        
        # Mark each presentation as deleted and also mark associated analyses
        for presentation in presentations:
            presentation.deleted_at = now
            
            # Mark voice analysis as deleted if it exists
            voice_analysis = db.query(VoiceAnalysis).filter(
                VoiceAnalysis.presentation_id == presentation.id,
                VoiceAnalysis.deleted_at.is_(None)
            ).first()
            if voice_analysis:
                voice_analysis.deleted_at = now
            
            # Mark body analysis as deleted if it exists
            body_analysis = db.query(BodyAnalysis).filter(
                BodyAnalysis.presentation_id == presentation.id,
                BodyAnalysis.deleted_at.is_(None)
            ).first()
            if body_analysis:
                body_analysis.deleted_at = now
        
        # Finally, mark the user as deleted
        user = db.query(User).filter(
            User.id == user_id,
            User.deleted_at.is_(None)
        ).first()
        
        if not user:
            return {"status": "error", "message": "User not found or already deleted"}
        
        user.deleted_at = now
        db.commit()
        
        return {"status": "success", "message": "User and associated data have been deleted"}
