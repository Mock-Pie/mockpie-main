from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import traceback

from backend.database.database import init_db
from backend.app.middleware.redis_middleware import RedisMiddleware
from backend.app.routers import auth, health, utils

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create all tables in the database
try:
    logger.info("Creating all tables...")
    init_db()
except Exception as e:
    logger.error(f"Failed to create database tables: {e}")

app = FastAPI(
    title="MockPie API",
    description="API for MockPie presentation analysis platform",
    version="1.0.0"
)

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

# Include routers
app.include_router(auth.router)
app.include_router(health.router)
app.include_router(utils.router)

# Global exception handler
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

