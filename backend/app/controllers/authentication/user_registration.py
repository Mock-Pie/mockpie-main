from fastapi import FastAPI, HTTPException, status, Depends, Form
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta, timezone
import jwt

from backend.database.database import *
from backend.app.schemas.user.user_schema import *
from backend.app.models.user.user import *
from backend.app.static.lang.error_messages.exception_responses import *
from backend.config import *
from backend.app.utils.user_auth_response_wrapper import *
from backend.app.utils.user_response import *

app = FastAPI()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 configuration
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

class RegisterUser():

    # Utility functions
    def verify_password(plain_password, hashed_password):
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def get_password_hash(password):
        return pwd_context.hash(password)

    @staticmethod
    def create_access_token(data: dict, expires_delta: timedelta | None = None):
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
        return encoded_jwt

    # @app.post("/auth/register", response_model=UserAuthResponse, status_code=status.HTTP_201_CREATED)
    def register_user(
        email: EmailStr = Form(...),
        username: str = Form(...),
        phone_number: str = Form(...),
        password: str = Form(...),
        password_confirmation: str = Form(...),
        gender: Gender = Form(...),
        db: Session = Depends(get_db)
    ):
        if password != password_confirmation:
            raise HTTPException(
                status_code=400, 
                detail=ErrorMessage.PASSWORD_MISMATCH.value
            )
        
        # Check if user with this email already exists
        db_user = db.query(User).filter(User.email == email).first()
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ErrorMessage.EMAIL_TAKEN.value
            )
        
        # Check if username is taken
        db_user = db.query(User).filter(User.username == username).first()
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ErrorMessage.USERNAME_TAKEN.value
            )
        
        # Check if phone number is taken
        db_user = db.query(User).filter(User.phone_number == phone_number).first()
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ErrorMessage.PHONE_TAKEN.value
            )
        
        # Create new user
        new_user = User(
            username=username,
            email=email,
            phone_number=phone_number,
            gender=gender,
            remember_token=""
        )
        new_user.password = RegisterUser.get_password_hash(password)
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Generate token
        token = RegisterUser.create_access_token(data={"sub": new_user.email})    
        
        return {
            "token": token,
            "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "phone_number": new_user.phone_number,
            "gender": new_user.gender,
            "created_at": new_user.created_at,
            "updated_at": new_user.updated_at,
            }
        }