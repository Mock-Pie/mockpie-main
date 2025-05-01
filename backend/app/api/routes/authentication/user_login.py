from fastapi import APIRouter, HTTPException, status, Depends
from database.database import get_db
from sqlalchemy.orm import Session
from schemas.user.user_schema import UserRegistration, UserResponse
from models.user.user import User
from static.lang.error_messages.exception_responses import ErrorMessage

router = APIRouter()

@router.post("auth/login", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def login(user_data: UserRegistration, db: Session = Depends(get_db)):
    # Check if the password and the password confirmation mismatch
    if user_data.password != user_data.password_confirmation:
        raise HTTPException(
            status_code=400, 
            detail=ErrorMessage.PASSWORD_MISMATCH.value
        )
    
    # Check if user with this email already exists
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ErrorMessage.EMAIL_TAKEN.value
        )
    
    # Check if username is taken
    db_user = db.query(User).filter(User.username == user_data.username).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ErrorMessage.USERNAME_TAKEN.value
        )
    
    # Check if phone number is taken
    db_user = db.query(User).filter(User.phone_number == user_data.phone_number).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ErrorMessage.PHONE_TAKEN.value
        )
    
    # Create new user
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        phone_number=user_data.phone_number,
        gender=user_data.gender,
        token="",
        refresh_token=""
    )
    
    # Set password (uses property setter for hashing)
    new_user.password = user_data.password
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user