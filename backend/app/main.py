from fastapi import FastAPI, status, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
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
from backend.app.utils.redis_dependency import get_redis_client
from backend.app.utils.token_handler import TokenHandler
from backend.app.middleware.redis_middleware import RedisMiddleware

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

# Add Redis middleware
app.add_middleware(RedisMiddleware)

# Add CORS middleware
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
    db: Session = Depends(get_db),
    redis: RedisClient = Depends(get_redis_client)
):
    return RegisterUser.register_user(email=email, username=username, phone_number=phone_number, 
                                     password=password, password_confirmation=password_confirmation,
                                     gender=gender, db=db, redis=redis)
    

@app.post("/auth/login", response_model=UserAuthResponse, status_code=status.HTTP_200_OK)
async def login_user(
    email: EmailStr = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
    redis: RedisClient = Depends(get_redis_client)
):
    return LoginUser.login_user(email=email, password=password, db=db, redis=redis)


@app.post("/auth/refresh", status_code=status.HTTP_200_OK)
async def refresh_token(
    refresh_token: str = Form(...),
    db: Session = Depends(get_db),
    redis: RedisClient = Depends(get_redis_client)
):
    return LoginUser.refresh_token(refresh_token=refresh_token, db=db, redis=redis)


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
    current_user: User = Depends(TokenHandler.get_current_user),
    redis: RedisClient = Depends(get_redis_client)
):
    TokenHandler.revoke_tokens(current_user.id, redis=redis)
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

# Replace your current root route with this:
@app.get("/", include_in_schema=False)
async def root():
    """Redirect root to API documentation"""
    return RedirectResponse(url="/docs")

@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check(redis: RedisClient = Depends(get_redis_client)):
    """Health check endpoint that also verifies Redis connection"""
    redis_status = {
        "status": "unknown",
        "message": ""
    }
    
    try:
        # Try to ping Redis
        if redis.redis.ping():
            redis_status["status"] = "connected"
            redis_status["message"] = "Redis connection is healthy"
            
            # Test basic Redis operations
            test_key = "health_check_test"
            test_value = f"test_{datetime.now().isoformat()}"
            
            # Try to set a value
            redis.redis.setex(test_key, 30, test_value)  # Expires in 30 seconds
            
            # Try to get the value back
            retrieved_value = redis.redis.get(test_key)
            
            if retrieved_value == test_value:
                redis_status["read_write_test"] = "passed"
            else:
                redis_status["read_write_test"] = "failed"
                redis_status["message"] += ", but read/write test failed"
                
        else:
            redis_status["status"] = "error"
            redis_status["message"] = "Ping failed without raising exception"
    except Exception as e:
        redis_status["status"] = "error"
        redis_status["message"] = f"Redis error: {str(e)}"
    
    return {
        "status": "ok",
        "redis": redis_status,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/redis-test", status_code=status.HTTP_200_OK)
async def test_redis_cache(redis: RedisClient = Depends(get_redis_client)):
    """
    Test endpoint for Redis caching functionality.
    This endpoint demonstrates the basic Redis operations used in the application.
    """
    test_results = {}
    
    # Test 1: Basic set and get
    try:
        test_key = "test_key"
        test_value = f"test_value_{datetime.now().isoformat()}"
        
        # Set a value with 1-minute expiration
        redis.redis.setex(test_key, 60, test_value)
        
        # Get the value back
        retrieved_value = redis.redis.get(test_key)
        
        test_results["basic_set_get"] = {
            "status": "success" if retrieved_value == test_value else "failed",
            "expected": test_value,
            "actual": retrieved_value
        }
    except Exception as e:
        test_results["basic_set_get"] = {
            "status": "error",
            "message": str(e)
        }
    
    # Test 2: Token storage
    try:
        test_user_id = 999999  # Use a high number to avoid conflicts
        test_token = f"test_token_{datetime.now().isoformat()}"
        expires = timedelta(minutes=5)
        
        # Store token
        redis.set_access_token(test_user_id, test_token, expires)
        
        # Retrieve token
        retrieved_token = redis.get_access_token(test_user_id)
        
        # Validate token
        validation_result = redis.validate_access_token(test_user_id, test_token)
        
        test_results["token_storage"] = {
            "status": "success" if retrieved_token == test_token and validation_result else "failed",
            "token_retrieved": retrieved_token == test_token,
            "token_validated": validation_result
        }
        
        # Clean up
        redis.revoke_tokens(test_user_id)
        
        # Verify cleanup
        retrieved_token_after_revoke = redis.get_access_token(test_user_id)
        test_results["token_revocation"] = {
            "status": "success" if retrieved_token_after_revoke is None else "failed",
            "token_after_revoke": retrieved_token_after_revoke
        }
    except Exception as e:
        test_results["token_storage"] = {
            "status": "error",
            "message": str(e)
        }
    
    return {
        "redis_test_results": test_results,
        "timestamp": datetime.now().isoformat()
    }


