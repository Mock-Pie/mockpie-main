from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import logging
import traceback
import os

from backend.app.middleware.redis_middleware import RedisMiddleware
from backend.app.routers import auth, health, presentations, utils, users, upcoming_presentations, feedback


# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
    allow_origins=["http://localhost:3000"],  # Only allow frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(health.router)
app.include_router(utils.router)
app.include_router(utils.ai_router)  # Include AI service router
app.include_router(presentations.router)
app.include_router(users.router)
app.include_router(upcoming_presentations.router)
app.include_router(feedback.router)

# Mount static files for uploaded videos
uploads_dir = "/app/backend/uploads"  # Absolute path in Docker container
if os.path.exists(uploads_dir):
    app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")
    logger.info(f"Mounted uploads directory: {uploads_dir}")
else:
    logger.warning(f"Uploads directory not found: {uploads_dir}")
    # Try to create the directory
    try:
        os.makedirs(uploads_dir, exist_ok=True)
        app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")
        logger.info(f"Created and mounted uploads directory: {uploads_dir}")
    except Exception as e:
        logger.error(f"Failed to create uploads directory: {e}")

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
