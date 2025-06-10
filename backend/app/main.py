from fastapi import FastAPI, HTTPException, status, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import EmailStr
from sqlalchemy.orm import Session
import logging
import traceback

from backend.database.database import get_db
from backend.app.models.user.user import User
from backend.app.enums.gender import Gender
from backend.app.controllers.authentication.user_registration import *
from backend.app.controllers.authentication.verify_otp import *
from backend.app.controllers.authentication.user_login import *
from backend.app.controllers.authentication.forgot_password import *
from backend.app.schemas.user.user_schema import *
from backend.app.utils.redis_client import RedisClient
from backend.app.utils.token_handler import TokenHandler
from backend.app.controllers.authentication.reset_password import ResetPassword

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create all tables in the database
try:
    logger.info("Creating all tables...")
    init_db()
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
    return await RegisterUser.register_user(email=email, username=username, phone_number=phone_number, 
                                     password=password, password_confirmation=password_confirmation,
                                     gender=gender, db=db)
    

@app.post("/auth/login", response_model=UserAuthResponse, status_code=status.HTTP_200_OK)
async def login_user(
    email: EmailStr = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    return await LoginUser.login_user(email=email, password=password, db=db)


@app.post("/auth/refresh", status_code=status.HTTP_200_OK)
async def refresh_token(
    refresh_token: str = Form(...),
    db: Session = Depends(get_db)
):
    return LoginUser.refresh_token(refresh_token=refresh_token, db=db)


@app.post("/auth/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
    email: str = Form(...),
    db: Session = Depends(get_db)
):
    return await ForgotPassword.forgot_password(email=email, db=db)

@app.post("/auth/reset-password", status_code=status.HTTP_200_OK)
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


@app.post("/auth/verify-otp", status_code=status.HTTP_200_OK)
async def verify_user_otp(
    email: EmailStr = Form(...),
    otp: str = Form(...),
    db: Session = Depends(get_db)
):
    return VerifyOTP.verify_user_otp(email=email, otp=otp, db=db)


@app.get("/auth/me", response_model=UserResponse)
async def get_current_user(current_user: User = Depends(TokenHandler.get_current_user)):
    return UserResponse.from_orm(current_user)


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


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    error_detail = str(exc)
    error_trace = traceback.format_exc()
    
    # Log the full error
    logger.error(f"Unhandled exception: {error_detail}")
    logger.error(error_trace)
    
    # Return a cleaner response to the client
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "message": error_detail}
    )