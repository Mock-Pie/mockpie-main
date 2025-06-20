from fastapi import APIRouter, status, Depends, Form
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
from backend.app.schemas.user.user_schema import UserAuthResponse, UserResponse
from backend.app.schemas.user.user_profile_schema import UserProfileResponse
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


@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(
    current_user: User = Depends(TokenHandler.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the current user's profile with all their presentations
    Uses JWT token for authentication
    """
    # Load the user with presentations included to ensure all relationships are populated
    user_with_presentations = db.query(User).filter(User.id == current_user.id).first()
    
    # Return as UserProfileResponse which includes presentations
    return user_with_presentations


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
