from fastapi import FastAPI, HTTPException, status, Depends, Form, Request
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
from backend.app.utils.redis_dependency import get_redis_client
from backend.app.utils.token_handler import TokenHandler
from backend.app.utils.encryption_handler import EncryptionHandler
from backend.app.crud.user import *


# OAuth2 configuration
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

class LoginUser:

    @staticmethod
    async def login_user(
        email: EmailStr = Form(...),
        password: str = Form(...),        
        db: Session = Depends(get_db),
        redis: RedisClient = Depends(get_redis_client)
    ):        
        """
        Log in a user and generate authentication tokens.
        
        Args:
            email: User's email address
            password: User's password
            db: Database session
            redis: Redis client from middleware
            
        Returns:
            dict: Authentication tokens and user information
            
        Raises:
            HTTPException: If login fails
        """
        # Find user by email
        user = db.query(User).filter(User.email == email).first()
        
        # print(match_plain_and_hashed_passwords(user, password), password, user.password)
        
        # Check if user exists and password matches
        if not user or not match_plain_and_hashed_passwords(user, password) or user.email_verified_at is None:
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
        
        try:
            # Store tokens in Redis using the Redis dependency
            TokenHandler.store_tokens_in_redis(
                user.id, 
                access_token, 
                refresh_token, 
                access_token_expires, 
                refresh_token_expires,
                redis=redis
            )
        except Exception as e:
            # Log but continue - JWT tokens still work without Redis
            print(f"Error storing tokens in Redis: {e}")
            print(f"Redis type: {type(redis)}")  # Debug info
        # Return response
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {
                "id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "username": user.username,
                "email": user.email,
                "phone_number": user.phone_number,
                "gender": user.gender,
                "created_at": user.created_at,
                "updated_at": user.updated_at,
            }
        }
    
    @staticmethod
    def refresh_token(
        refresh_token: str, 
        db: Session = Depends(get_db),
        redis: RedisClient = Depends(get_redis_client)
    ):
        """
        Generate new access token using refresh token.
        
        Args:
            refresh_token: The refresh token
            db: Database session
            redis: Redis client from middleware
            
        Returns:
            dict: New access token
            
        Raises:
            HTTPException: If refresh token is invalid
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
            
            try:
                # Verify refresh token in Redis
                if not redis.validate_refresh_token(user.id, refresh_token):
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail=ErrorMessage.INVALID_REFRESH_TOKEN.value
                    )
            except Exception as e:
                # Log but continue with JWT validation only if Redis fails
                print(f"Error validating refresh token in Redis: {e}")
                # We already validated the JWT, so we can proceed
            
            # Generate new access token
            access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
            access_token = TokenHandler.create_access_token(
                data={"sub": user.email}, expires_delta=access_token_expires
            )
            
            try:
                # Store new access token in Redis
                redis.set_access_token(user.id, access_token, access_token_expires)
            except Exception as e:
                # Log but continue - JWT token still works without Redis
                print(f"Error storing access token in Redis: {e}")
            
            return {
                "access_token": access_token,
                "token_type": "bearer"
            }
            
        except jwt.PyJWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=ErrorMessage.INVALID_REFRESH_TOKEN.value
            )