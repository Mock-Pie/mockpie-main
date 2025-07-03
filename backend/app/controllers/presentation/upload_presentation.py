from fastapi import Depends, HTTPException, status, UploadFile, File, Form
from typing import Optional
import os
import shutil
from pathlib import Path
from datetime import datetime

from backend.app.models.user.user import User
from backend.app.utils.token_handler import TokenHandler
from backend.app.crud.presentation import *
from backend.app.static.lang.error_messages.exception_responses import ErrorMessage


class UploadPresentation:
    @staticmethod
    async def upload_video(
        file: UploadFile = File(...),
        title: Optional[str] = Form(None),
        language: Optional[str] = Form(None),
        topic: Optional[str] = Form(None),
        current_user: User = Depends(TokenHandler.get_current_user),
    ):
        """
        Upload a video file
        
        Args:
            file: The video file to upload
            title: Optional title for the video
            language: language of the presentation
            topic: topic of the presentation
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
                    detail=ErrorMessage.INVALID_FILE_FORMAT.value
                )
            
            # Get file size
            file_size = file_path.stat().st_size
            
            # Generate URL for the file (relative to the uploads directory)
            file_url = f"/uploads/videos/{unique_filename}"
            
            # Use provided title or generate one from filename
            video_title = title if title else Path(file.filename).stem
            
            # Create presentation record in database
            presentation = create_presentation(
                user_id=current_user.id,
                title=video_title,
                url=file_url,
                language=language,
                topic=topic,
                is_public=False,
                uploaded_at=datetime.now()
            )
            
            return {
                "message": "Presentation uploaded successfully",
                "presentation_id": presentation.id,
                "title": video_title,
                "language": language,
                "topic": topic,
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