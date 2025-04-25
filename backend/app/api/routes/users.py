from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ....database.database import get_db
from ...models.user.user import User
from ...schemas.user.user_schema import UserCreate, UserResponse, UserUpdate
# from ...core.security import get_password_hash, verify_password
from ...api.deps import get_current_user
from ...static.lang.error_messages.exception_responses import ErrorMessage

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user.
    """
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


@router.get("/", response_model=List[UserResponse])
def read_users(
    skip: int = 0, 
    limit: int = 100, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve users. 
    Requires authentication.
    """
    # Only admin should be able to list all users
    # This is a placeholder - you'll need to implement admin check
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    """
    Get current user information.
    Requires authentication.
    """
    return current_user


@router.get("/{user_id}", response_model=UserResponse)
def read_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Get a specific user by ID.
    Requires authentication.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=ErrorMessage.USER_NOT_FOUND.value
        )
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a user.
    Users can only update their own data.
    Requires authentication.
    """
    # Check if user is updating their own profile
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=ErrorMessage.INSUFFICIENT_PERMISSIONS.value
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ErrorMessage.USER_NOT_FOUND.value
        )
    
    # Update user fields
    user_data = user_update.dict(exclude_unset=True)
    
    # Handle password separately for hashing
    if "password" in user_data and user_data["password"]:
        user.password = user_data.pop("password")
    
    # Update other fields
    for key, value in user_data.items():
        if value is not None:
            setattr(user, key, value)
    
    db.commit()
    db.refresh(user)
    
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a user.
    Users can only delete their own account.
    Requires authentication.
    """
    # Check if user is deleting their own profile
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=ErrorMessage.INSUFFICIENT_PERMISSIONS.value
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ErrorMessage.USER_NOT_FOUND.value
        )
    
    db.delete(user)
    db.commit()
    
    return None