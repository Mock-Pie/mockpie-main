from fastapi import APIRouter, HTTPException, Depends, Form, status
from sqlalchemy.orm import Session
from uuid import uuid4
from datetime import datetime, timedelta
from typing import Dict, Any

from backend.database.database import get_db
from backend.app.models.user.user import User
from backend.app.services.authentication.email_service import *
from backend.app.crud.user import *
from backend.app.static.lang.error_messages.exception_responses import *
from backend.app.crud.user import *


class ResetPassword:

    @staticmethod
    async def reset_password(
        email: str = Form(...),
        new_password: str = Form(...),
        confirm_password: str = Form(...),
        db: Session = Depends(get_db)
    ) -> Dict[str, Any]:
        """
        Reset user password using a valid token
        """
        # Validate new password and confirm password match
        if new_password != confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ErrorMessage.PASSWORDS_DO_NOT_MATCH.value
            )

        # Find user by email
        user = get_user_by_email(db, email)
    
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=ErrorMessage.USER_NOT_FOUND.value
            )
        
        # Check if this is a temporary user (username starts with "verify_")
        is_temp_user = user.username.startswith("verify_")
        
        # For regular users, check email verification requirement
        if not is_temp_user and user.email_verified_at is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ErrorMessage.EMAIL_NOT_VERIFIED.value
            )
        
        # For regular users, check if more than 5 minutes have passed since verification
        if not is_temp_user and user.email_verified_at:
            verification_expiry = user.email_verified_at + timedelta(minutes=5)
            if datetime.now() > verification_expiry:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Session expired. Please request a new password reset or re-verify your email."
                )

        # Add debug before password update
        print(f"Updating password for user: {user.email} (temp user: {is_temp_user})")
        result = update_user_password(db, user, new_password)
        print(f"Password update result: {result}")

        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to reset password"
            )

        return {"message": "Password has been successfully reset"}
