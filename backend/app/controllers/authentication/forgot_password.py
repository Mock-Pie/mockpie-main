from fastapi import HTTPException, Depends, Form, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from backend.database.database import get_db
from backend.app.services.authentication.email_service import EmailService
from backend.app.crud.user import get_user_by_email, set_otp_and_otp_expiry_time
from backend.app.static.lang.error_messages.exception_responses import ErrorMessage
from backend.app.utils.otp_handler import OTPHandler

class ForgotPassword:
    # Make this async if EmailService.send_otp_email is async
    @staticmethod
    async def forgot_password(
        email: str = Form(...),
        db: Session = Depends(get_db)
    ) -> Dict[str, Any]:
        
        user = get_user_by_email(db, email)

        if not user:
            raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=ErrorMessage.EMAIL_DOES_NOT_EXIST.value
                )

        # Create a unique otp
        otp = OTPHandler.generate_otp()
        expiry = OTPHandler.get_otp_expiry()

        # Update user with reset otp information using CRUD function
        if not set_otp_and_otp_expiry_time(db, user, otp, expiry):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create password reset otp"
            )

        # Send the reset email
        try:
            # Add await if this is an async method
            await EmailService.send_otp_email(user.email, otp, is_registration=False)
            return {"message": "Password reset OTP has been sent to your email"}
        except Exception as e:
            # If email sending fails, roll back the otp
            user.otp = None
            user.otp_expired_at = None
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send password reset email"
            )
