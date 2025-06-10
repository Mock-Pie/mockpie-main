# app/crud/user.py
from sqlalchemy.orm import Session
from datetime import datetime

from backend.app.models.user import User
from backend.app.utils.encryption_handler import EncryptionHandler


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()

def get_user_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username).first()

def set_otp_and_otp_expiry_time(db: Session, user: User, otp: str, expiry: datetime) -> bool:
    try:
        user.otp = otp
        user.otp_expired_at = expiry
        user.email_verified_at = None
        db.commit()
        return True
    except Exception:
        db.rollback()
        return False

def verify_otp(db: Session, email: str, otp: str) -> User | None:
    user = get_user_by_email(db, email)
    
    # Check if user exists and OTP matches
    if not user or user.otp != otp:
        return None
    
    # Check if OTP has expired
    if user.otp_expired_at and user.otp_expired_at < datetime.now():
        return None
    
    # Clear OTP and set email_verified_at
    user.otp = None
    user.otp_expired_at = None
    user.email_verified_at = datetime.now()
    
    db.commit()
    return user

def update_user_password(db: Session, user: User, new_password: str) -> bool:
    try:
        # Make sure password is properly hashed using the User model's setter
        user.password = new_password
        
        # Update the updated_at timestamp
        user.updated_at = datetime.now()
        
        # Commit changes to database
        db.commit()
        db.refresh(user)
        return True
    except Exception as e:
        db.rollback()
        print(f"Error updating password: {str(e)}")
        return False
    
def match_plain_and_hashed_passwords(user: User, password: str) -> bool:
    """
    Verify user's password against the stored hash.
    """
    # print(password, user._password)
    if not user or not user._password:
        return False
    return EncryptionHandler.verify_plain_password(password, user._password)