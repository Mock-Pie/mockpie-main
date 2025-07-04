from pydantic import BaseModel, EmailStr
from fastapi import HTTPException, Depends, Form, status
from sqlalchemy.orm import Session

from backend.app.crud.user import verify_otp
from backend.database.database import get_db
from backend.app.static.lang.error_messages.exception_responses import ErrorMessage


class VerifyOTP(BaseModel):
    def verify_user_otp(
        email: EmailStr = Form(...),
        otp: str = Form(...),
        db: Session = Depends(get_db)
    ):
        user = verify_otp(db, email, otp)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ErrorMessage.INVALID_OTP.value
            )
        
        return {
            "message": "Email verified successfully",
            "verified": True
        }