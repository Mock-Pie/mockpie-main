from fastapi import FastAPI, HTTPException, status, Depends, Form
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta, timezone
import jwt

from backend.database.database import get_db
from backend.app.schemas.user.user_schema import *
from backend.app.models.user.user import User
from backend.app.static.lang.error_messages.exception_responses import ErrorMessage
from backend.config import settings
from backend.app.utils.redis_client import RedisClient
from backend.app.utils.token_handler import TokenHandler
from backend.app.utils.encryption_handler import EncryptionHandler


# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 configuration
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

class LoginUser:

    @staticmethod
    def login_user(
        email: EmailStr = Form(...),
        password: str = Form(...),
        db: Session = Depends(get_db)
    ):        # Find user by email
        user = db.query(User).filter(User.email == email).first()
        
        # Check if user exists and password matches
        if not user or not user.verify_password(password):
            print("Invalid credentials")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=ErrorMessage.INVALID_CREDENTIALS.value,
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Generate tokens
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = TokenHandler.create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        refresh_token_expires = timedelta(days=settings.refresh_token_expire_days)
        refresh_token = TokenHandler.create_access_token(
            data={"sub": user.email, "refresh": True}, expires_delta=refresh_token_expires
        )
        
        # Store tokens in Redis
        redis_client = RedisClient()
        redis_client.set_access_token(user.id, access_token, access_token_expires)
        redis_client.set_refresh_token(user.id, refresh_token, refresh_token_expires)
        
        # Update user last login timestamp if needed
        # user.last_login = datetime.now(timezone.utc)
        # db.commit()
        
        # Return response
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "phone_number": user.phone_number,
                "gender": user.gender,
                "created_at": user.created_at,
                "updated_at": user.updated_at,
            }
        }
    
    @staticmethod
    def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
        """
        Generate new access token using refresh token.
        """
        try:
            # Decode refresh token
            payload = jwt.decode(refresh_token, settings.secret_key, algorithms=[settings.algorithm])
            email = payload.get("sub")
            is_refresh = payload.get("refresh", False)
            
            if not email or not is_refresh:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=ErrorMessage.INVALID_REFRESH_TOKEN.value
                )
            
            # Get user
            user = db.query(User).filter(User.email == email).first()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=ErrorMessage.INVALID_REFRESH_TOKEN.value
                )
            
            # Verify refresh token in Redis
            redis_client = RedisClient()
            if not redis_client.validate_refresh_token(user.id, refresh_token):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=ErrorMessage.INVALID_REFRESH_TOKEN.value
                )
            
            # Generate new access token
            access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
            access_token = TokenHandler.create_access_token(
                data={"sub": user.email}, expires_delta=access_token_expires
            )
            
            # Store new access token in Redis
            redis_client.set_access_token(user.id, access_token, access_token_expires)
            
            return {
                "access_token": access_token,
                "token_type": "bearer"
            }
            
        except jwt.PyJWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=ErrorMessage.INVALID_REFRESH_TOKEN.value
            )