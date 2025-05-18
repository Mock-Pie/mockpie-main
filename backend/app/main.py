from fastapi import FastAPI, HTTPException, status, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from backend.database.database import get_db, engine, Base
from backend.app.models.user.user import User
from backend.app.enums.gender import Gender
from backend.app.static.lang.error_messages.exception_responses import ErrorMessage
from passlib.context import CryptContext
import logging
from backend.app.controllers.authentication.user_registration import *
from backend.app.schemas.user.user_schema import *
from backend.app.utils.user_auth_response_wrapper import *
from backend.app.utils.user_response import *


# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create all tables in the database
try:
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")
except Exception as e:
    logger.error(f"Failed to create database tables: {e}")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Routes
@app.post("/auth/register", response_model=UserAuthResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    email: EmailStr = Form(...),
    username: str = Form(...),
    phone_number: str = Form(...),
    password: str = Form(...),
    password_confirmation: str = Form(...),
    gender: Gender = Form(...),
    db: Session = Depends(get_db)
):
    return RegisterUser.register_user(email=email, username=username, phone_number=phone_number, password=password, password_confirmation=password_confirmation,gender=gender, db=db)
    