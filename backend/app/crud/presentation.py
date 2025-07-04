import os
import uuid
import mimetypes

from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session
from typing import Optional
from pathlib import Path
from datetime import datetime

from backend.app.models.presentation.presentation import Presentation
from backend.app.crud.presentation import *

# Configuration
UPLOAD_DIR = Path("/app/backend/uploads/videos")  # Absolute path for Docker volume mount
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
ALLOWED_VIDEO_TYPES = {
    "video/mp4", "video/avi", "video/mkv", "video/mov", "video/wmv", 
    "video/flv", "video/webm", "video/m4v", "video/3gp", "video/quicktime"
}

def ensure_upload_directory():
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def validate_video_file(file: UploadFile) -> None:
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


def get_presentations_by_user_id(current_user_id, db, skip, limit):
    return db.query(Presentation).filter(Presentation.user_id == current_user_id).offset(skip).limit(limit).all()


def get_presentation_by_id(db: Session, presentation_id: int, current_user) -> Optional[Presentation]:
    return db.query(Presentation).filter(Presentation.id == presentation_id, Presentation.user_id == current_user.id).first()


def toggle_presentation_visibility(
    db: Session, 
    presentation: Presentation, 
) -> Presentation:
    
    if not presentation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Presentation not found"
        )
    
    # Toggle visibility
    presentation.is_public = not presentation.is_public
    
    try:
        db.commit()
        db.refresh(presentation)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error toggling visibility: {str(e)}"
        )
    
    return presentation


def create_presentation(db, user_id,title,url,language,topic,is_public,uploaded_at):
    presentation = Presentation(
        user_id=user_id,
        title=title,
        url=url,
        language=language,
        topic=topic,
        is_public=is_public,
        uploaded_at=uploaded_at
    )
    
    try:
        db.add(presentation)
        db.commit()
        db.refresh(presentation)
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating presentation: {str(e)}"
        )
    
    return presentation


def delete_video_file(presentation: Presentation) -> None:
    if (presentation.url is None):
        return
    
    if presentation.url.startswith("/uploads/videos/"):
        filename = presentation.url.replace("/uploads/videos/", "")
        file_path = UPLOAD_DIR / filename
        if file_path.exists():
            try:
                os.remove(file_path)
            except Exception as e:
                # Log error but continue with database deletion
                print(f"Warning: Could not delete file {file_path}: {e}")


def delete_presentation(
    db: Session, 
    presentation: Presentation, 
) -> Presentation:
    
    try:
        db.delete(presentation)
        db.commit()
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting presentation: {str(e)}"
        )
    


def get_file_info(presentation: Presentation) -> dict:
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
            
    return file_info