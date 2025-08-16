from fastapi import FastAPI, HTTPException, status, Depends, Form
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from datetime import timedelta

from backend.database.database import *
from backend.app.schemas.user.user_schema import *
from backend.app.models.user.user import *
from backend.app.static.lang.error_messages.exception_responses import ErrorMessage
from backend.config import *
from backend.app.schemas.user.user_schema import *
from backend.app.utils.token_handler import TokenHandler
from backend.app.utils.otp_handler import OTPHandler
from backend.app.services.authentication.email_service import EmailService
from backend.app.utils.redis_client import RedisClient
from backend.app.crud.user import *
from backend.app.utils.redis_dependency import get_redis_client

app = FastAPI()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 configuration
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


class RegisterUser():
    @staticmethod
    async def register_user(
        first_name: str = Form(...),
        last_name: str = Form(...),
        email: EmailStr = Form(...),
        username: str = Form(...),
        phone_number: str = Form(...),
        password: str = Form(...),
        password_confirmation: str = Form(...),
        gender: Gender = Form(...),
        db: Session = Depends(get_db),
        redis: RedisClient = Depends(get_redis_client)
    ):
        """
        Register a new user and generate authentication tokens.
        
        Args:
            first_name: User's first name
            last_name: User's last name
            email: User's email address
            username: User's username
            phone_number: User's phone number
            password: User's password
            password_confirmation: Password confirmation
            gender: User's gender
            db: Database session
            redis: Redis client from middleware
            
        Returns:
            dict: Authentication tokens and user information
            
        Raises:
            HTTPException: If registration fails        """
        # Check if user with this email already exists
        db_user = get_user_by_email_no_deleted_at(db, email)
        
        is_active_user, exception = check_recently_deleted_user(
            db_user, ErrorMessage.DELETED_USER_EXISTS_WITH_THIS_EMAIL.value
        )
        
        if exception:
            raise exception
        
        if is_active_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ErrorMessage.EMAIL_TAKEN.value
            )
        
        # Check if username is taken
        db_user = get_user_by_username_no_deleted_at(db, username)
        
        is_active_user, exception = check_recently_deleted_user(
            db_user, ErrorMessage.DELETED_USER_EXISTS_WITH_THIS_USERNAME.value
        )
        
        if exception:
            raise exception
        
        if is_active_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ErrorMessage.USERNAME_TAKEN.value
            )
        
        # Check if phone number is taken
        db_user = get_user_by_phone_number_no_deleted_at(db, phone_number)
        
        is_active_user, exception = check_recently_deleted_user(
            db_user, ErrorMessage.DELETED_USER_EXISTS_WITH_THIS_PHONE.value
        )
        
        if exception:
            raise exception
        
        if is_active_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ErrorMessage.PHONE_TAKEN.value
            )
            
        if password != password_confirmation:
            raise HTTPException(
                status_code=400, 
                detail=ErrorMessage.PASSWORD_MISMATCH.value
            )
            
        # Create new user
        new_user = create_user(db, first_name, last_name, username, email, phone_number, gender, password)
        
         # Generate OTP
        otp = OTPHandler.generate_otp()
        otp_expiry = OTPHandler.get_otp_expiry()
        
        # Store OTP in database
        set_otp_and_otp_expiry_time(db, new_user, otp, otp_expiry)
        
        # Send OTP email
        await EmailService.send_otp_email(email, otp, is_registration=True)
        
        # Generate token
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = TokenHandler.create_access_token(
            data={"sub": new_user.email}, expires_delta=access_token_expires
        )
        
        refresh_token_expires = timedelta(days=settings.refresh_token_expire_days)
        refresh_token = TokenHandler.create_refresh_token(
            data={"sub": new_user.email}, expires_delta=refresh_token_expires
        )
        
        try:
            # Store tokens in Redis using the dependency
            TokenHandler.store_tokens_in_redis(
                new_user.id, 
                access_token, 
                refresh_token, 
                access_token_expires, 
                refresh_token_expires,
                redis=redis
            )
        except Exception as e:
            # Log but continue - JWT tokens still work without Redis
            print(f"Error storing tokens in Redis during registration: {e}")
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {
                "id": new_user.id,
                "first_name": new_user.first_name,
                "last_name": new_user.last_name,
                "username": new_user.username,
                "email": new_user.email,
                "phone_number": new_user.phone_number,
                "gender": new_user.gender,
                "created_at": new_user.created_at,
                "updated_at": new_user.updated_at,
            }
        }