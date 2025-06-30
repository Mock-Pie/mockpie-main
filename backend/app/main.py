from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import logging
import traceback
import os

from backend.app.middleware.redis_middleware import RedisMiddleware
from backend.app.routers import auth, health, presentations, utils, users, upcoming_presentations


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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(health.router)
app.include_router(utils.router)
app.include_router(presentations.router)
app.include_router(users.router)
app.include_router(upcoming_presentations.router)

# Mount static files for uploaded videos
uploads_dir = "uploads"  # Relative to the app working directory
if os.path.exists(uploads_dir):
    app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")
    logger.info(f"Mounted uploads directory: {os.path.abspath(uploads_dir)}")
else:
    logger.warning(f"Uploads directory not found: {os.path.abspath(uploads_dir)}")

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
