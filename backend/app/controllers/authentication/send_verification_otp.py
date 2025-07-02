from fastapi import HTTPException, Depends, Form, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from backend.database.database import get_db
from backend.app.services.authentication.email_service import EmailService
from backend.app.crud.user import get_user_by_email, set_otp_and_otp_expiry_time
from backend.app.static.lang.error_messages.exception_responses import ErrorMessage
from backend.app.utils.otp_handler import OTPHandler

class SendVerificationOTP:
    @staticmethod
    async def send_verification_otp(
        email: str = Form(...),
        db: Session = Depends(get_db)
    ) -> Dict[str, Any]:
        """
        Send verification OTP for unverified users
        """
        user = get_user_by_email(db, email)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ErrorMessage.EMAIL_DOES_NOT_EXIST.value
            )

        # Check if user is already verified
        if user.email_verified_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already verified"
            )

        # Create a unique OTP
        otp = OTPHandler.generate_otp()
        expiry = OTPHandler.get_otp_expiry()

        # Update user with verification OTP information
        if not set_otp_and_otp_expiry_time(db, user, otp, expiry):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create verification OTP"
            )

        # Send the verification email
        try:
            await EmailService.send_otp_email(user.email, otp, is_registration=True)
            return {"message": "Verification OTP has been sent to your email"}
        except Exception as e:
            # If email sending fails, roll back the OTP
            user.otp = None
            user.otp_expired_at = None
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send verification email"
            ) 