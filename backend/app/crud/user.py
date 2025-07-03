from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, Tuple
from datetime import datetime, timedelta, timezone

from backend.app.models.user import User
from backend.app.utils.encryption_handler import EncryptionHandler



def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email, User.deleted_at == None).first()


def get_user_by_email_no_deleted_at(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_deleted_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email, User.deleted_at != None).first()


def get_user_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username, User.deleted_at == None).first()


def get_user_by_username_no_deleted_at(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username).first()


def get_user_by_phone_number_no_deleted_at(db: Session, phone_number: str) -> User | None:
    return db.query(User).filter(User.phone_number == phone_number).first()


def get_user_by_username_exclude_current_user(db: Session, username: str, current_user: User) -> User | None:
    db.query(User).filter(User.username == username, User.id != current_user.id).first()
    
    
def get_user_by_email_excluding_current_user(db: Session, email: str, current_user: User) -> User | None:
    return db.query(User).filter(User.email == email,User.id != current_user.id).first()   
    
    
def get_user_by_phone_number_excluding_current_user(db: Session, phone_number: str, current_user_id: User) -> User | None:
    return db.query(User).filter(User.phone_number == phone_number, User.id != current_user_id).first()
    
    
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


def set_restore_otp_and_expiry_time(db: Session, user: User, otp: str, expiry: datetime) -> bool:
    try:
        user.otp = otp
        user.otp_expired_at = expiry
        # Don't clear email_verified_at for restore operations
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
    if not user or not user._password:
        return False
    return EncryptionHandler.verify_plain_password(password, user._password)


def create_user(
    db: Session, 
    first_name: str, 
    last_name: str, 
    username: str, 
    email: str, 
    phone_number: str,
    gender: str,
    password: str
):
    new_user = User(
        first_name=first_name,
        last_name=last_name,
        username=username,
        email=email,
        phone_number=phone_number,
        gender=gender,
        remember_token=""
    )
    new_user.password = password 
    
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error creating user: {str(e)}"
        )
    
    return new_user

def update_user(
    db: Session, 
    user: User):
    
    try:
        db.commit()
        db.refresh(user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error updating user: {str(e)}"
        )


def check_recently_deleted_user(user: Optional[User], error_message: str) -> Tuple[bool, Optional[HTTPException]]:
    if not user:
        return False, None
    
    if user.deleted_at is None:
        # User exists and is not deleted
        return True, None
        
    # User exists but is deleted - check if deletion was recent
    deleted_at = user.deleted_at
    if deleted_at.tzinfo is None:
        deleted_at = deleted_at.replace(tzinfo=timezone.utc)
    
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    
    if deleted_at > thirty_days_ago:
        # User was deleted within the last 30 days
        return False, HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    
    # User was deleted more than 30 days ago
    return False, None


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id, User.deleted_at.is_(None)).first()
