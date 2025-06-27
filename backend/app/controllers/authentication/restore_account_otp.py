from fastapi import HTTPException, Depends, Form, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from backend.database.database import get_db
from backend.app.models.user.user import User
from backend.app.services.authentication.email_service import EmailService
from backend.app.utils.otp_handler import OTPHandler
from backend.app.crud.user import get_user_by_email, set_restore_otp_and_expiry_time
from backend.app.static.lang.error_messages.exception_responses import ErrorMessage

class RestoreAccountOTP:
    @staticmethod
    async def send_restore_otp(
        email: str = Form(...),
        db: Session = Depends(get_db)
    ) -> Dict[str, Any]:
        """
        Send OTP for account restoration verification
        """
        # Find the deleted user
        user = db.query(User).filter(User.email == email, User.deleted_at != None).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No deleted account found with this email address"
            )
            
        # Check if user was deleted within the last 30 days
        from datetime import datetime, timezone, timedelta
        
        deleted_at = user.deleted_at
        # Ensure deleted_at has timezone info
        if deleted_at.tzinfo is None:
            deleted_at = deleted_at.replace(tzinfo=timezone.utc)
            
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        
        if deleted_at < thirty_days_ago:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot restore accounts deleted more than 30 days ago"
            )
        
        # Create a unique OTP
        otp = OTPHandler.generate_otp()
        expiry = OTPHandler.get_otp_expiry()

        # Update user with OTP information
        if not set_restore_otp_and_expiry_time(db, user, otp, expiry):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create restoration OTP"
            )

        # Send the OTP email
        try:
            await EmailService.send_restore_account_otp_email(user.email, otp)
            return {"message": "Restoration OTP has been sent to your email"}
        except Exception as e:
            # If email sending fails, roll back the OTP
            user.otp = None
            user.otp_expired_at = None
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send restoration OTP email"
            ) 