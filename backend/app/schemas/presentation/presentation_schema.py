from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database.database import get_db
from app.models.user.user import User
from backend.app.schemas.user.user_schema import *

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user_data: UserRegistration, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create SQLAlchemy User instance
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        phone_number=user_data.phone_number,
        gender=user_data.gender,
        token="",  # Initialize with empty tokens
        refresh_token=""
    )
    
    
    # Set password (uses the password property setter)
    new_user.password = user_data.password
    
    # Save to database
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Return response - FastAPI automatically converts to UserResponse
    return new_user

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user