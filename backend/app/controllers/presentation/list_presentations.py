from fastapi import Depends
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.app.models.user.user import User
from backend.app.utils.token_handler import TokenHandler
from backend.app.crud.presentation import *


class ListPresentations:
    @staticmethod
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
        presentations = get_presentations_by_user_id(
            current_user_id=current_user.id,
            db=db,
            skip=skip,
            limit=limit
        )            
        
        return {
            "videos": [
                {
                    "id": p.id,
                    "title": p.title,
                    "url": p.url,
                    "is_public": p.is_public,
                    "uploaded_at": p.uploaded_at.isoformat(),
                    "topic": p.topic,
                }
                for p in presentations
            ],
            "total": len(presentations),
            "skip": skip,
            "limit": limit
        }