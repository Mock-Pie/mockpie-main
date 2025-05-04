from fastapi import FastAPI, HTTPException, status, Depends, Form
from pydantic import BaseModel, EmailStr, field_validator, Field
from database.database import get_db, engine, Base
from sqlalchemy.orm import Session
from app.schemas.user.user_schema import UserRegistration, UserResponse
from app.models.user.user import User
from app.enums.gender import Gender
from app.static.lang.error_messages.exception_responses import ErrorMessage
from fastapi.middleware.cors import CORSMiddleware
import logging
# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create all tables in the database
# This will ensure the users table with all columns exists
try:
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")
except Exception as e:
    logger.error(f"Failed to create database tables: {e}")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    email: EmailStr = Form(...),
    username: str = Form(...),
    phone_number: str = Form(...),
    password: str = Form(...),
    password_confirmation: str = Form(...),
    gender: Gender = Form(...),
    db: Session = Depends(get_db)):
    # Check if the password and the password confirmation mismatch
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

    
    # Set password (uses property setter for hashing)
    new_user.password = password
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user



@app.get("/")
async def root():
    return {"message": "Welcome to the FastAPI application!"}
