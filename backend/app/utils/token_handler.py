from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Union
import jwt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from backend.config import settings
from backend.database.database import get_db
from backend.app.models.user.user import User
from backend.app.static.lang.error_messages.exception_responses import ErrorMessage
from backend.app.utils.redis_client import RedisClient
from backend.app.utils.redis_dependency import get_redis_client

# OAuth2 scheme for token extraction
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

class TokenHandler:
    """
    Utility class for handling authentication tokens.
    """

    @staticmethod
    def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """
        Create a JWT access token.
        
        Args:
            data: The data to encode in the token
            expires_delta: Optional expiration time delta
            
        Returns:
            str: The encoded JWT token
        """
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=15)
            
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
        
        return encoded_jwt
    
    
    @staticmethod
    def create_refresh_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """
        Create a JWT refresh token.
        
        Args:
            data: The data to encode in the token
            expires_delta: Optional expiration time delta
            
        Returns:
            str: The encoded JWT refresh token
        """
        to_encode = data.copy()
        to_encode.update({"refresh": True})  # Mark as refresh token
        
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(days=7)  # Default to 7 days
            
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
        return encoded_jwt
    
    
    @staticmethod
    def decode_token(token: str) -> Dict[str, Any]:
        """
        Decode a JWT token.
        
        Args:
            token: The JWT token to decode
            
        Returns:
            Dict: The decoded token payload
            
        Raises:
            HTTPException: If the token is invalid
        """
        try:
            return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        except jwt.PyJWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=ErrorMessage.INVALID_TOKEN.value,
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    
    @staticmethod
    def get_current_user(
        token: str = Depends(oauth2_scheme), 
        db: Session = Depends(get_db),
        redis: RedisClient = Depends(get_redis_client)
    ):
        """
        Get the current authenticated user from a token.
        
        Args:
            token: The JWT token
            db: Database session
            redis: Redis client from middleware
            
        Returns:
            User: The authenticated user
        Raises:
            HTTPException: If authentication fails
        """
        try:
            payload = TokenHandler.decode_token(token)
            email = payload.get("sub")
            if email is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=ErrorMessage.INVALID_TOKEN.value,
                    headers={"WWW-Authenticate": "Bearer"},
                )
                
            user = db.query(User).filter(User.email == email, User.deleted_at == None).first()
            if user is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=ErrorMessage.INVALID_TOKEN.value,
                    headers={"WWW-Authenticate": "Bearer"},
                )
                  # Verify token in Redis if Redis client is available
            try:
                # Always validate token in Redis - if it fails, it's invalid
                if not redis.validate_access_token(user.id, token):
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail=ErrorMessage.INVALID_TOKEN.value,
                        headers={"WWW-Authenticate": "Bearer"},
                    )
            except Exception as e:
                # Log the error but still consider token as invalid
                # This is to ensure security - a token should be checked against Redis
                # If Redis is down, we should not bypass token validation
                print(f"Error validating token in Redis: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=ErrorMessage.REDIS_CONNECTION_ERROR.value,
                    headers={"WWW-Authenticate": "Bearer"},
                )
                
            return user
            
        except jwt.PyJWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=ErrorMessage.INVALID_TOKEN.value,
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    
    @staticmethod
    def store_tokens_in_redis(
        user_id: Union[int, Any],
        access_token: str,
        refresh_token: str,
        access_expires: timedelta,
        refresh_expires: timedelta,
        redis: RedisClient = None
    ):
        """
        Store authentication tokens in Redis.
        
        Args:
            user_id: User ID
            access_token: JWT access token
            refresh_token: JWT refresh token
            access_expires: Access token expiration
            refresh_expires: Refresh token expiration
            redis: Redis client instance (optional)
        """
        try:
            # Use provided Redis client or create a new one
            redis_client = redis or RedisClient()
            redis_client.set_access_token(user_id, access_token, access_expires)
            redis_client.set_refresh_token(user_id, refresh_token, refresh_expires)
        except Exception as e:
            # Log the error but don't fail - the JWT itself is still valid
            print(f"Error storing tokens in Redis: {e}")
            
            
    @staticmethod
    def revoke_tokens(user_id: Union[int, Any], redis: RedisClient = None):
        """
        Revoke all tokens for a user (logout).
        
        Args:
            user_id: User ID
            redis: Redis client instance (optional)
        
        Returns:
            bool: True if tokens were successfully revoked, False otherwise
        """
        try:
            # Use provided Redis client or create a new one
            redis_client = redis or RedisClient()
            # Try to revoke tokens and verify the operation
            redis_client.revoke_tokens(user_id)
            
            # Verify that tokens were actually revoked by checking they don't exist anymore
            access_token = redis_client.get_access_token(user_id)
            refresh_token = redis_client.get_refresh_token(user_id)
            
            if access_token is not None or refresh_token is not None:
                print(f"Warning: Tokens for user {user_id} may not have been fully revoked")
                return False
            
            return True
        except Exception as e:
            # Log the error
            print(f"Error revoking tokens: {e}")
            return False