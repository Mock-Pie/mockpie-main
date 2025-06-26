from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
import os
import shutil
import uuid
from pathlib import Path
import mimetypes
# import magic  # Optional: install python-magic for better file type detection
from datetime import datetime

from backend.database.database import get_db
from backend.app.models.user.user import User
from backend.app.models.presentation.presentation import Presentation
from backend.app.utils.token_handler import TokenHandler
from backend.app.utils.redis_client import RedisClient
from backend.app.utils.redis_dependency import get_redis_client
from backend.app.controllers.presentation.toggle_visibility import ToggleVisibility

router = APIRouter(prefix="/presentations", tags=["presentations"])

# Configuration
UPLOAD_DIR = Path("uploads/videos")
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
ALLOWED_VIDEO_TYPES = {
    "video/mp4", "video/avi", "video/mkv", "video/mov", "video/wmv", 
    "video/flv", "video/webm", "video/m4v", "video/3gp", "video/quicktime"
}

def ensure_upload_directory():
    """Ensure the upload directory exists"""
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def validate_video_file(file: UploadFile) -> None:
    """
    Validate the uploaded video file
    
    Args:
        file: The uploaded file
        
    Raises:
        HTTPException: If file validation fails
    """
    # Check file size
    if hasattr(file, 'size') and file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size too large. Maximum allowed size is {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    # Check content type
    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type. Allowed types: {', '.join(ALLOWED_VIDEO_TYPES)}"
        )
    
    # Validate file extension
    file_extension = Path(file.filename).suffix.lower()
    allowed_extensions = {'.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.3gp'}
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file extension. Allowed extensions: {', '.join(allowed_extensions)}"
        )

def sanitize_filename(filename: str) -> str:
    """
    Sanitize the filename to prevent directory traversal and other security issues
    
    Args:
        filename: Original filename
        
    Returns:
        str: Sanitized filename
    """
    # Get just the filename without path
    filename = os.path.basename(filename)
    
    # Remove or replace dangerous characters
    dangerous_chars = ['<', '>', ':', '"', '|', '?', '*', '/', '\\']
    for char in dangerous_chars:
        filename = filename.replace(char, '_')
    
    # Limit length
    name, ext = os.path.splitext(filename)
    if len(name) > 100:
        name = name[:100]
    
    return f"{name}{ext}"

def generate_unique_filename(original_filename: str, user_id: int) -> str:
    """
    Generate a unique filename to prevent conflicts
    
    Args:
        original_filename: Original filename
        user_id: User ID
        
    Returns:
        str: Unique filename
    """
    sanitized_name = sanitize_filename(original_filename)
    name, ext = os.path.splitext(sanitized_name)
    unique_id = str(uuid.uuid4())[:8]
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    return f"user_{user_id}_{timestamp}_{unique_id}_{name}{ext}"

def verify_file_content(file_path: Path) -> bool:
    """
    Verify the file content using magic number detection
    
    Args:
        file_path: Path to the uploaded file
        
    Returns:
        bool: True if file is a valid video file
    """
    try:
        # Try to use python-magic if available
        try:
            import magic
            mime_type = magic.from_file(str(file_path), mime=True)
            return mime_type.startswith('video/')
        except ImportError:
            # Fallback to mimetypes if magic is not available
            mime_type, _ = mimetypes.guess_type(str(file_path))
            return mime_type and mime_type.startswith('video/')
    except Exception:
        # Final fallback - just check file extension
        return file_path.suffix.lower() in {'.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.3gp'}

@router.post("/upload")
async def upload_video(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    current_user: User = Depends(TokenHandler.get_current_user),
    db: Session = Depends(get_db),
    redis: RedisClient = Depends(get_redis_client)
):
    """
    Upload a video file
    
    Args:
        file: The video file to upload
        title: Optional title for the video
        current_user: Authenticated user
        db: Database session
        redis: Redis client
        
    Returns:
        dict: Upload response with file information
        
    Raises:
        HTTPException: If upload fails
    """
    try:
        # Validate the file
        validate_video_file(file)
        
        # Ensure upload directory exists
        ensure_upload_directory()
        
        # Generate unique filename
        unique_filename = generate_unique_filename(file.filename, current_user.id)
        file_path = UPLOAD_DIR / unique_filename
        
        # Save the file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Verify file content after saving
        if not verify_file_content(file_path):
            # Delete the file if it's not a valid video
            os.remove(file_path)
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="File content is not a valid video format"
            )
        
        # Get file size
        file_size = file_path.stat().st_size
        
        # Generate URL for the file (relative to the uploads directory)
        file_url = f"/uploads/videos/{unique_filename}"
        
        # Use provided title or generate one from filename
        video_title = title if title else Path(file.filename).stem
        
        # Create presentation record in database
        presentation = Presentation(
            user_id=current_user.id,
            title=video_title,
            url=file_url,
            is_public=False,
            uploaded_at=datetime.now()
        )
        
        db.add(presentation)
        db.commit()
        db.refresh(presentation)
        
        return {
            "message": "Video uploaded successfully",
            "presentation_id": presentation.id,
            "title": video_title,
            "filename": unique_filename,
            "original_filename": file.filename,
            "file_url": file_url,
            'is_public': presentation.is_public,
            "file_size": file_size,
            "uploaded_at": presentation.uploaded_at.isoformat(),
            "content_type": file.content_type
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Clean up file if it was created but database operation failed
        if 'file_path' in locals() and file_path.exists():
            try:
                os.remove(file_path)
            except:
                pass
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload video: {str(e)}"
        )

@router.get("/")
async def list_user_videos(
    current_user: User = Depends(TokenHandler.get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 10
):
    """
    List all videos for the current user
    
    Args:
        current_user: Authenticated user
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        
    Returns:
        dict: List of user's videos
    """
    presentations = db.query(Presentation).filter(
        Presentation.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    return {
        "videos": [
            {
                "id": p.id,
                "title": p.title,
                "url": p.url,
                "is_public": p.is_public,
                "uploaded_at": p.uploaded_at.isoformat()
            }
            for p in presentations
        ],
        "total": len(presentations),
        "skip": skip,
        "limit": limit
    }

@router.get("/{presentation_id}")
async def get_video_details(
    presentation_id: int,
    current_user: User = Depends(TokenHandler.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get details of a specific video
    
    Args:
        presentation_id: ID of the presentation
        current_user: Authenticated user
        db: Database session
        
    Returns:
        dict: Video details
        
    Raises:
        HTTPException: If video not found or access denied
    """
    presentation = db.query(Presentation).filter(
        Presentation.id == presentation_id,
        Presentation.user_id == current_user.id
    ).first()
    
    if not presentation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    # Get file info if file exists
    file_info = {}
    if presentation.url.startswith("/uploads/videos/"):
        filename = presentation.url.replace("/uploads/videos/", "")
        file_path = UPLOAD_DIR / filename
        if file_path.exists():
            file_info = {
                "file_size": file_path.stat().st_size,
                "file_exists": True
            }
        else:
            file_info = {"file_exists": False}
    
    return {
        "id": presentation.id,
        "title": presentation.title,
        "url": presentation.url,
        "uploaded_at": presentation.uploaded_at.isoformat(),
        "file_info": file_info
    }

@router.delete("/{presentation_id}")
async def delete_video(
    presentation_id: int,
    current_user: User = Depends(TokenHandler.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a video and its file
    
    Args:
        presentation_id: ID of the presentation
        current_user: Authenticated user
        db: Database session
        
    Returns:
        dict: Deletion confirmation
        
    Raises:
        HTTPException: If video not found or access denied
    """
    presentation = db.query(Presentation).filter(
        Presentation.id == presentation_id,
        Presentation.user_id == current_user.id
    ).first()
    
    if not presentation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    # Delete the physical file
    if presentation.url.startswith("/uploads/videos/"):
        filename = presentation.url.replace("/uploads/videos/", "")
        file_path = UPLOAD_DIR / filename
        if file_path.exists():
            try:
                os.remove(file_path)
            except Exception as e:
                # Log error but continue with database deletion
                print(f"Warning: Could not delete file {file_path}: {e}")
    
    # Delete from database
    db.delete(presentation)
    db.commit()
    
    return {
        "message": "Video deleted successfully",
        "presentation_id": presentation_id
    }

@router.patch("/{presentation_id}/toggle-visibility")
async def toggle_presentation_visibility(
    presentation_id: int,
    current_user: User = Depends(TokenHandler.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Toggle the is_public field for a presentation
    
    Args:
        presentation_id: ID of the presentation
        current_user: Authenticated user
        db: Database session
        
    Returns:
        dict: Updated presentation visibility status
        
    Raises:
        HTTPException: If presentation not found or access denied
    """
    return await ToggleVisibility.toggle_visibility(presentation_id, current_user, db)
