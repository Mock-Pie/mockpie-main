# test_imports.py
"""
This script tests if all necessary imports can be loaded without errors.
"""
import sys
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add the parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    logger.info("Testing FastAPI imports...")
    from fastapi import FastAPI, HTTPException, status, Depends, Form
    from fastapi.middleware.cors import CORSMiddleware
    logger.info("FastAPI imports successful")
    
    logger.info("Testing database imports...")
    from backend.database.database import get_db, engine, Base
    logger.info("Database imports successful")
    
    logger.info("Testing model imports...")
    from backend.app.models.user.user import User
    from backend.app.enums.gender import Gender
    logger.info("Model imports successful")
    
    logger.info("Testing controller imports...")
    from backend.app.controllers.authentication.user_registration import RegisterUser
    from backend.app.controllers.authentication.user_login import LoginUser
    logger.info("Controller imports successful")
    
    logger.info("Testing schema imports...")
    from backend.app.schemas.user.user_schema import UserAuthResponse, UserResponse
    logger.info("Schema imports successful")
    
    logger.info("Testing utility imports...")
    from backend.app.utils.redis_client import RedisClient
    from backend.app.utils.token_handler import TokenHandler
    logger.info("Utility imports successful")
    
    logger.info("All imports successful!")
except Exception as e:
    logger.error(f"Import error: {e}")
    raise
