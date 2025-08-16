from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from backend.database.database import get_db
from backend.app.models.user.user import User
from backend.app.models.upcoming_presentation.upcoming_presentation import UpcomingPresentation
from backend.app.utils.token_handler import TokenHandler
from backend.app.controllers.upcoming_presentation.create_upcoming_presentation import CreateUpcomingPresentation
from backend.app.controllers.upcoming_presentation.edit_upcoming_presentation import EditUpcomingPresentation
from backend.app.controllers.upcoming_presentation.list_upcoming_presentations import ListUpcomingPresentations
from backend.app.controllers.upcoming_presentation.delete_upcoming_presentation import DeleteUpcomingPresentation
from backend.app.schemas.upcoming_presentation.upcoming_presentation_schema import (
    UpcomingPresentationResponse, 
    UpcomingPresentationList
)
from backend.app.static.lang.error_messages.exception_responses import ErrorMessage

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
    return await CreateUpcomingPresentation.create_upcoming_presentation(
        topic=topic,
        presentation_date=presentation_date,
        current_user=current_user,
        db=db
    )


@router.get("/", response_model=UpcomingPresentationList)
async def list_upcoming_presentations(
    current_user: User = Depends(TokenHandler.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all presentations for the current user (regardless of date)
    
    Args:
        current_user: Authenticated user
        db: Database session
        
    Returns:
        UpcomingPresentationList: List of all presentations
    """
    return await ListUpcomingPresentations.list_upcoming_presentations(
        current_user=current_user,
        db=db
    )


@router.delete("/{presentation_id}")
async def delete_upcoming_presentation(
    presentation_id: int,
    current_user: User = Depends(TokenHandler.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Soft delete an upcoming presentation
    
    Args:
        presentation_id: ID of the upcoming presentation to delete
        current_user: Authenticated user
        db: Database session
        
    Returns:
        dict: Deletion confirmation
        
    Raises:
        HTTPException: If presentation not found or access denied
    """
    return await DeleteUpcomingPresentation.delete_upcoming_presentation(
        presentation_id=presentation_id,
        current_user=current_user,
        db=db
    )
    
    
    
@router.post("/{presentation_id}/edit", response_model=UpcomingPresentationResponse)
async def edit_upcoming_presentation(
    presentation_id: int,
    topic: str = Form(...),
    presentation_date: str = Form(...),
    current_user: User = Depends(TokenHandler.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Edit an existing upcoming presentation
    
    Args:
        presentation_id: ID of the upcoming presentation to edit
        topic: New topic for the presentation
        presentation_date: New date for the presentation (ISO format: YYYY-MM-DDTHH:MM:SS)
        current_user: Authenticated user
        db: Database session
        
    Returns:
        UpcomingPresentationResponse: Updated upcoming presentation information
        
    Raises:
        HTTPException: If update fails or access denied
    """
    return await EditUpcomingPresentation.edit_upcoming_presentation(
        presentation_id=presentation_id,
        topic=topic,
        presentation_date=presentation_date,
        current_user=current_user,
        db=db
    )