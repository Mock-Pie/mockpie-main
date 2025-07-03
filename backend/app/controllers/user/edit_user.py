from fastapi import Depends, status, Body
from sqlalchemy.orm import Session

from backend.app.schemas.user.user_schema import UserUpdate, UserResponse
from backend.app.utils.token_handler import TokenHandler
from backend.app.models.user.user import User
from backend.app.utils.otp_handler import OTPHandler
from backend.app.static.lang.error_messages.exception_responses import ErrorMessage
from backend.database.database import get_db
from backend.app.crud.user import *
from backend.app.services.authentication.email_service import EmailService


class EditUser:
    @staticmethod
    async def edit_user(  
            user_update: UserUpdate = Body(...), 
            current_user: User = Depends(TokenHandler.get_current_user), 
            db: Session = Depends(get_db)
        ): 
        """
        Update current user profile information
        """
        # Update only the fields that are provided
        if user_update.first_name is not None:
            current_user.first_name = user_update.first_name
            
        if user_update.last_name is not None:
            current_user.last_name = user_update.last_name
            
        if user_update.username is not None:
            # Check if username is already taken by another user
            existing_user = get_user_by_username_exclude_current_user(db, user_update.username, current_user)
            
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=ErrorMessage.USERNAME_TAKEN.value
                )
                
            current_user.username = user_update.username
            
        if user_update.email is not None:
            existing_user = get_user_by_email_excluding_current_user(db, user_update.email, current_user.id)    
            
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=ErrorMessage.EMAIL_TAKEN.value
                )

            # Update email and send OTP for verification
            current_user.email = user_update.email
            current_user.email_verified_at = None
            
            # Generate OTP for email verification
            otp = OTPHandler.generate_otp()
            otp_expiry = OTPHandler.get_otp_expiry()
            
            # Store OTP in database
            set_otp_and_otp_expiry_time(db, current_user, otp, otp_expiry)
            
            # Send OTP email
            await EmailService.send_otp_email(user_update.email, otp, is_registration=False)
            
        if user_update.phone_number is not None:
            # Check if phone number is already taken by another user
            existing_user = get_user_by_phone_number_excluding_current_user(db, user_update.phone_number, current_user.id)
            
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail= ErrorMessage.PHONE_TAKEN.value
                )
                
            current_user.phone_number = user_update.phone_number
            
        if user_update.gender is not None:
            current_user.gender = user_update.gender
        
        update_user(db, current_user)
        return UserResponse.model_validate(current_user)
    