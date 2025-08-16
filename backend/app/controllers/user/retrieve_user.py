from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta

from backend.app.static.lang.error_messages.exception_responses import ErrorMessage
from backend.app.crud.user import *
from backend.app.crud.presentation import * 
from backend.app.crud.upcoming_presentation import *   


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
        # Find the deleted user
        user = get_deleted_user_by_email(db, email)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail=ErrorMessage.USER_NOT_FOUND.value
            )
            
        # Check if user was deleted within the last 30 days
        deleted_at = user.deleted_at
        
        if deleted_at.tzinfo is None:
            deleted_at = deleted_at.replace(tzinfo=timezone.utc)
            
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        
        if deleted_at < thirty_days_ago:
            # User was deleted more than 30 days ago
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ErrorMessage.RESTORE_ACCOUNT_DENIED.value
            )
        
        # Verify OTP
        if not user.otp or user.otp != otp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ErrorMessage.INVALID_OTP.value
            )
        
        # Check if OTP has expired
        if user.otp_expired_at and user.otp_expired_at < datetime.now():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ErrorMessage.EXPIRED_OTP.value
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
            presentations = get_presentations_by_user_id(user.id, db, skip=0, limit=9999)
            
            if presentations:
                for presentation in presentations:
                    # Reactivate the presentation
                    presentation.deleted_at = None
            
            # Find and reactivate all upcoming presentations associated with the user
            upcoming_presentations = get_upcoming_presentations_by_deleted_user_id(user.id, db, skip=0, limit=1000)
            
            if upcoming_presentations:
                for upcoming_presentation in upcoming_presentations:
                    # Reactivate the upcoming presentation
                    upcoming_presentation.deleted_at = None
                    
            # Commit all changes
            db.commit()
            return user
            
        except Exception as e:
            # Rollback in case of any error
            db.rollback()
            print(f"Error reactivating user: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail=ErrorMessage.RETRIVAL_FAILED.value
            )
        
