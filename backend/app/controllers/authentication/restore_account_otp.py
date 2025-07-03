from fastapi import HTTPException, Depends, Form, status
from sqlalchemy.orm import Session
from typing import Dict, Any
from datetime import datetime, timezone, timedelta

from backend.database.database import get_db
from backend.app.services.authentication.email_service import EmailService
from backend.app.utils.otp_handler import OTPHandler
from backend.app.crud.user import *
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
        user = get_deleted_user_by_email(db, email)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=ErrorMessage.NO_DELETED_USER_FOUND.value
            )
       
        deleted_at = user.deleted_at
        # Ensure deleted_at has timezone info
        if deleted_at.tzinfo is None:
            deleted_at = deleted_at.replace(tzinfo=timezone.utc)
            
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        
        if deleted_at < thirty_days_ago:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ErrorMessage.RESTORE_ACCOUNT_DENIED.value
            )
        
        # Create a unique OTP
        otp = OTPHandler.generate_otp()
        expiry = OTPHandler.get_otp_expiry()

        # Update user with OTP information
        if not set_restore_otp_and_expiry_time(db, user, otp, expiry):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=ErrorMessage.FAILED_TO_CREATE_RESTORATION_OTP.value
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
                detail=ErrorMessage.FAILED_TO_SEND_RESTORATION_OTP_EMAIL.value
            ) 