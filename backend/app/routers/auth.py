from fastapi import APIRouter, status, Depends, Form, Body
from pydantic import EmailStr
from sqlalchemy.orm import Session
from typing import Dict, Any

from backend.database.database import get_db
from backend.app.models.user.user import User
from backend.app.enums.gender import Gender
from backend.app.controllers.authentication.user_registration import RegisterUser
from backend.app.controllers.authentication.verify_otp import VerifyOTP
from backend.app.controllers.authentication.user_login import LoginUser
from backend.app.controllers.authentication.forgot_password import ForgotPassword
from backend.app.controllers.authentication.reset_password import ResetPassword
from backend.app.schemas.user.user_schema import UserAuthResponse, UserResponse, UserUpdate
from backend.app.utils.redis_client import RedisClient
from backend.app.utils.redis_dependency import get_redis_client
from backend.app.utils.token_handler import TokenHandler

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=UserAuthResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    first_name: str = Form(...),
    last_name: str = Form(...),
    email: EmailStr = Form(...),
    username: str = Form(...),
    phone_number: str = Form(...),
    password: str = Form(...),
    password_confirmation: str = Form(...),
    gender: Gender = Form(...),
    db: Session = Depends(get_db),
    redis: RedisClient = Depends(get_redis_client)
):    return await RegisterUser.register_user(
        first_name=first_name,
        last_name=last_name,
        email=email, 
        username=username, 
        phone_number=phone_number, 
        password=password, 
        password_confirmation=password_confirmation,
        gender=gender, 
        db=db, 
        redis=redis
    )


@router.post("/login", response_model=UserAuthResponse, status_code=status.HTTP_200_OK)
async def login_user(
    email: EmailStr = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
    redis: RedisClient = Depends(get_redis_client)
):
    return await LoginUser.login_user(email=email, password=password, db=db, redis=redis)


@router.post("/refresh", status_code=status.HTTP_200_OK)
async def refresh_token(
    refresh_token: str = Form(...),
    db: Session = Depends(get_db),
    redis: RedisClient = Depends(get_redis_client)
):
    return LoginUser.refresh_token(refresh_token=refresh_token, db=db, redis=redis)


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
    email: str = Form(...),
    db: Session = Depends(get_db)
):
    return await ForgotPassword.forgot_password(email=email, db=db)


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    email: EmailStr = Form(...),
    new_password: str = Form(...),
    confirm_password: str = Form(...),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    return await ResetPassword.reset_password(
        email=email,
        new_password=new_password,
        confirm_password=confirm_password,
        db=db
    )


@router.post("/verify-otp", status_code=status.HTTP_200_OK)
async def verify_user_otp(
    email: EmailStr = Form(...),
    otp: str = Form(...),
    db: Session = Depends(get_db)
):
    return VerifyOTP.verify_user_otp(email=email, otp=otp, db=db)


@router.get("/me", response_model=UserResponse)
async def get_current_user(current_user: User = Depends(TokenHandler.get_current_user)):
    return UserResponse.from_orm(current_user)


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate = Body(...),
    current_user: User = Depends(TokenHandler.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update current user profile information
    """
    # Update only the fields that are provided
    if user_update.first_name is not None:
        current_user.first_name = user_update.first_name
    if user_update.last_name is not None:
        current_user.last_name = user_update.last_name
    if user_update.username is not None:
        # Check if username is already taken by another user
        existing_user = db.query(User).filter(
            User.username == user_update.username,
            User.id != current_user.id
        ).first()
        if existing_user:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username is already taken"
            )
        current_user.username = user_update.username
    if user_update.email is not None:
        # Check if email is already taken by another user
        existing_user = db.query(User).filter(
            User.email == user_update.email,
            User.id != current_user.id
        ).first()
        if existing_user:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already taken"
            )
        current_user.email = user_update.email
    if user_update.phone_number is not None:
        # Check if phone number is already taken by another user
        existing_user = db.query(User).filter(
            User.phone_number == user_update.phone_number,
            User.id != current_user.id
        ).first()
        if existing_user:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number is already taken"
            )
        current_user.phone_number = user_update.phone_number
    if user_update.gender is not None:
        current_user.gender = user_update.gender
    
    try:
        db.commit()
        db.refresh(current_user)
        return UserResponse.from_orm(current_user)
    except Exception as e:
        db.rollback()
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user profile"
        )


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    current_user: User = Depends(TokenHandler.get_current_user),
    redis: RedisClient = Depends(get_redis_client)
):
    # Attempt to revoke tokens and get the result
    revocation_success = TokenHandler.revoke_tokens(current_user.id, redis=redis)
    
    if not revocation_success:
        # Log the issue but still respond with success to the client
        print(f"Warning: There was an issue revoking tokens for user {current_user.id}")
    
    return {"message": "Successfully logged out", "tokens_revoked": revocation_success}


@router.delete("/cleanup-temp-user", status_code=status.HTTP_200_OK)
async def cleanup_temp_user(
    email: EmailStr = Form(...),
    db: Session = Depends(get_db)
):
    """
    Clean up temporary users created for email verification
    """
    try:
        # Find and delete temporary users with this email
        # Temp users have usernames starting with "verify_" or "email_verify_"
        temp_user = db.query(User).filter(
            User.email == email,
            User.username.like("verify_%")
        ).first()
        
        if temp_user:
            db.delete(temp_user)
            db.commit()
            return {"message": "Temporary user cleaned up successfully"}
        else:
            return {"message": "No temporary user found to clean up"}
    except Exception as e:
        db.rollback()
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cleanup temporary user"
        )
