from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from backend.database.database import get_db
from backend.app.models.user.user import User
from backend.app.models.upcoming_presentation.upcoming_presentation import UpcomingPresentation
from backend.app.utils.token_handler import TokenHandler
from backend.app.controllers.upcoming_presentation.create_upcoming_presentation import CreateUpcomingPresentation
from backend.app.schemas.upcoming_presentation.upcoming_presentation_schema import (
    UpcomingPresentationCreate, 
    UpcomingPresentationResponse, 
    UpcomingPresentationList
)

router = APIRouter(prefix="/upcoming-presentations", tags=["upcoming-presentations"])


@router.post("/", response_model=dict)
async def create_upcoming_presentation(
    topic: str = Form(...),
    presentation_date: str = Form(...),
    current_user: User = Depends(TokenHandler.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new upcoming presentation
    
    Args:
        topic: The topic of the presentation
        presentation_date: The date when the presentation will be held (ISO format: YYYY-MM-DDTHH:MM:SS)
        current_user: Authenticated user
        db: Database session
        
    Returns:
        dict: Created upcoming presentation information
        
    Raises:
        HTTPException: If creation fails
    """
    try:
        # Parse the date string to datetime
        parsed_date = datetime.fromisoformat(presentation_date.replace('Z', '+00:00'))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use ISO format: YYYY-MM-DDTHH:MM:SS"
        )
    
    return await CreateUpcomingPresentation.create_upcoming_presentation(
        topic=topic,
        presentation_date=parsed_date,
        current_user=current_user,
        db=db
    )


@router.get("/", response_model=UpcomingPresentationList)
async def list_upcoming_presentations(
    current_user: User = Depends(TokenHandler.get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 10
):
    """
    Get all upcoming presentations for the current user
    
    Args:
        current_user: Authenticated user
        db: Database session
        skip: Number of records to skip for pagination
        limit: Maximum number of records to return
        
    Returns:
        UpcomingPresentationList: List of upcoming presentations
    """
    upcoming_presentations = db.query(UpcomingPresentation).filter(
        UpcomingPresentation.user_id == current_user.id,
        UpcomingPresentation.deleted_at.is_(None)
    ).order_by(UpcomingPresentation.presentation_date.asc()).offset(skip).limit(limit).all()
    
    return UpcomingPresentationList(
        upcoming_presentations=[
            UpcomingPresentationResponse(
                id=presentation.id,
                topic=presentation.topic,
                presentation_date=presentation.presentation_date,
                created_at=presentation.created_at
            )
            for presentation in upcoming_presentations
        ],
        total=len(upcoming_presentations)
    ) 