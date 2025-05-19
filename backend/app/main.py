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
from backend.app.controllers.authentication.user_login import *
from backend.app.schemas.user.user_schema import *
from backend.app.utils.redis_client import RedisClient
from backend.app.utils.token_handler import TokenHandler

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
    return RegisterUser.register_user(email=email, username=username, phone_number=phone_number, 
                                     password=password, password_confirmation=password_confirmation,
                                     gender=gender, db=db)
    

@app.post("/auth/login", response_model=UserAuthResponse, status_code=status.HTTP_200_OK)
async def login_user(
    email: EmailStr = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    return LoginUser.login_user(email=email, password=password, db=db)


@app.post("/auth/refresh", status_code=status.HTTP_200_OK)
async def refresh_token(
    refresh_token: str = Form(...),
    db: Session = Depends(get_db)
):
    return LoginUser.refresh_token(refresh_token=refresh_token, db=db)


@app.get("/aaaa", status_code=status.HTTP_200_OK)
async def test():
    return {
        "refresh_token":"hi"
    }

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user(current_user: User = Depends(TokenHandler.get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "phone_number": current_user.phone_number,
        "gender": current_user.gender,
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at
    }


@app.post("/auth/logout", status_code=status.HTTP_200_OK)
async def logout(
    current_user: User = Depends(TokenHandler.get_current_user)
):
    redis_client = RedisClient()
    redis_client.revoke_tokens(current_user.id)
    return {"message": "Successfully logged out"}

# Add a diagnostic routes endpoint to help troubleshoot API registration
@app.get("/api/routes")
async def list_routes():
    """List all registered routes in this FastAPI application"""
    routes = []
    for route in app.routes:
        if hasattr(route, "methods"):
            methods = list(route.methods) if route.methods else ["GET"]
        else:
            methods = ["GET"]
            
        route_info = {
            "path": getattr(route, "path", str(route)),
            "name": getattr(route, "name", ""),
            "methods": methods
        }
        routes.append(route_info)
    return {"routes": routes}


# import random
# reload_test_id = random.randint(1000, 9999)

# @app.get("/test-reload")
# def test_reload():
#     """Test if hot reloading is working"""
#     return {
#         "message": "Hot reload works!",
#         "id": reload_test_id  # This will change on each reload
#     }