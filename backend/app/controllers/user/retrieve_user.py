from fastapi import HTTPException, Depends, Form, status, Body
from sqlalchemy.orm import Session


from backend.app.schemas.user.user_schema import UserUpdate, UserResponse
from backend.app.utils.token_handler import TokenHandler
from backend.app.models.user.user import User
from backend.app.utils.otp_handler import OTPHandler
from backend.app.static.lang.error_messages.exception_responses import ErrorMessage
from backend.database.database import get_db
from backend.app.crud.user import *
from backend.app.services.authentication.email_service import EmailService


class RetrieveUser:
    @staticmethod
    async def get_user(email: str, otp: str, db: Session):
        """
        Retrieve a deleted user and reactivate all associated presentations and analyses
        Requires OTP verification
        
        Args:
            email: Email of the deleted user
            otp: OTP for verification
            db: Database session
            
        Returns:
            User: The reactivated user
            
        Raises:
            HTTPException: If user not found, OTP invalid, or error occurs
        """
        from backend.app.models.presentation.presentation import Presentation
        from backend.app.models.analysis.voice_analysis import VoiceAnalysis
        from backend.app.models.analysis.body_analysis import BodyAnalysis
          # Find the deleted user
        user = db.query(User).filter(User.email == email, User.deleted_at != None).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=ErrorMessage.USER_NOT_FOUND.value)
            
        # Check if user was deleted within the last 30 days
        from datetime import datetime, timezone, timedelta
        
        deleted_at = user.deleted_at
        # Ensure deleted_at has timezone info
        if deleted_at.tzinfo is None:
            deleted_at = deleted_at.replace(tzinfo=timezone.utc)
            
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        
        if deleted_at < thirty_days_ago:
            # User was deleted more than 30 days ago
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot retrieve accounts deleted more than 30 days ago"
            )
        
        # Verify OTP
        if not user.otp or user.otp != otp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OTP"
            )
        
        # Check if OTP has expired
        if user.otp_expired_at and user.otp_expired_at < datetime.now():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP has expired. Please request a new one."
            )
        
        try:
            # Clear OTP after successful verification
            user.otp = None
            user.otp_expired_at = None
            
            # Reactivate the user
            user.deleted_at = None
            
            # Always set email verification status after successful OTP verification
            # This ensures the user can login directly after account restoration
            user.email_verified_at = datetime.now()
            
            # Find and reactivate all presentations associated with the user
            presentations = db.query(Presentation).filter(
                Presentation.user_id == user.id,
                Presentation.deleted_at != None
            ).all()
            
            for presentation in presentations:
                # Reactivate the presentation
                presentation.deleted_at = None
                
                # Reactivate associated voice analysis
                voice_analysis = db.query(VoiceAnalysis).filter(
                    VoiceAnalysis.presentation_id == presentation.id,
                    VoiceAnalysis.deleted_at != None
                ).first()
                
                if voice_analysis:
                    voice_analysis.deleted_at = None
                    
                # Reactivate associated body analysis
                body_analysis = db.query(BodyAnalysis).filter(
                    BodyAnalysis.presentation_id == presentation.id,
                    BodyAnalysis.deleted_at != None
                ).first()
                
                if body_analysis:
                    body_analysis.deleted_at = None
                    
            # Commit all changes
            db.commit()
            return user
            
        except Exception as e:
            # Rollback in case of any error
            db.rollback()
            print(f"Error reactivating user: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Error reactivating user and associated data"
            )
        
