from fastapi import FastAPI, HTTPException, status, Depends, Form
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta, timezone
import jwt

from backend.database.database import *
from backend.app.schemas.user.user_schema import *
from backend.app.models.user.user import *
from backend.app.static.lang.error_messages.exception_responses import *
from backend.config import *
from backend.app.schemas.user.user_schema import *
from backend.app.utils.token_handler import TokenHandler
from backend.app.utils.encryption_handler import EncryptionHandler
from backend.app.utils.redis_client import RedisClient
app = FastAPI()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 configuration
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

class RegisterUser():
    
    def register_user(
        email: EmailStr = Form(...),
        username: str = Form(...),
        phone_number: str = Form(...),
        password: str = Form(...),
        password_confirmation: str = Form(...),
        gender: Gender = Form(...),
        db: Session = Depends(get_db)
    ):
        if password != password_confirmation:
            raise HTTPException(
                status_code=400, 
                detail=ErrorMessage.PASSWORD_MISMATCH.value
            )
        
        # Check if user with this email already exists
        db_user = db.query(User).filter(User.email == email).first()
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ErrorMessage.EMAIL_TAKEN.value
            )
        
        # Check if username is taken
        db_user = db.query(User).filter(User.username == username).first()
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ErrorMessage.USERNAME_TAKEN.value
            )
        
        # Check if phone number is taken
        db_user = db.query(User).filter(User.phone_number == phone_number).first()
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ErrorMessage.PHONE_TAKEN.value
            )
        
        # Create new user
        new_user = User(
            username=username,
            email=email,
            phone_number=phone_number,
            gender=gender,
            remember_token=""
        )
        new_user.password = EncryptionHandler.get_password_hash(password)
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Generate token
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = TokenHandler.create_access_token(
            data={"sub": new_user.email}, expires_delta=access_token_expires
        )
        refresh_token_expires = timedelta(days=settings.refresh_token_expire_days)
        refresh_token = TokenHandler.create_access_token(
            data={"sub": new_user.email}, expires_delta=refresh_token_expires
        )
        redis_client = RedisClient()
        # Store tokens in Redis
        redis_client.set_access_token(new_user.id, access_token, access_token_expires)
        redis_client.set_refresh_token(new_user.id, refresh_token, refresh_token_expires)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "phone_number": new_user.phone_number,
            "gender": new_user.gender,
            "created_at": new_user.created_at,
            "updated_at": new_user.updated_at,
            }
        }