from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import jwt
from backend.config import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class EncryptionHandler:
    """
    Utility class for handling encryption, hashing, and verification.
    """
    
    @staticmethod
    def verify_plain_password(plain_password: str, hashed_password: str) -> bool:
        """
        Verify a plain password against a hashed password.
        
        Args:
            plain_password: The plain text password to verify
            hashed_password: The hashed password to check against
            
        Returns:
            bool: True if the password matches, False otherwise
        """
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def get_password_hash(password: str) -> str:
        """
        Hash a password using the configured password context.
        
        Args:
            password: The plain text password to hash
            
        Returns:
            str: The hashed password
        """
        return pwd_context.hash(password)