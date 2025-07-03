from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional

from backend.app.crud.presentation import *
from backend.database.database import get_db
from backend.app.models.user.user import User
from backend.app.utils.token_handler import TokenHandler
from backend.app.controllers.presentation.toggle_visibility import ToggleVisibility
from backend.app.controllers.presentation.delete_presentation import DeletePresentation
from backend.app.controllers.presentation.upload_presentation import UploadPresentation
from backend.app.controllers.presentation.list_presentations import ListPresentations
from backend.app.controllers.presentation.get_presentation import GetPresentation


router = APIRouter(prefix="/presentations", tags=["presentations"])


@router.post("/upload")
async def upload_video(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    language: Optional[str] = Form(None),
    topic: Optional[str] = Form(None),
    current_user: User = Depends(TokenHandler.get_current_user),
    db: Session = Depends(get_db)
):
    return await UploadPresentation.upload_video(
        file=file,
        title=title,
        language=language,
        topic=topic,
        current_user=current_user,
        db=db
    )
        

@router.get("/")
async def list_user_videos(
    current_user: User = Depends(TokenHandler.get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 10
):
    return await ListPresentations.list_user_videos(
        current_user=current_user,
        db=db,
        skip=skip,
        limit=limit
    )

@router.get("/{presentation_id}")
async def get_video_details(
    presentation_id: int,
    current_user: User = Depends(TokenHandler.get_current_user),
    db: Session = Depends(get_db)
):
    return await GetPresentation.get_video_details(
       presentation_id=presentation_id,
        current_user=current_user,
        db=db
    )

@router.delete("/{presentation_id}")
async def delete_video(
    presentation_id: int,
    current_user: User = Depends(TokenHandler.get_current_user),
    db: Session = Depends(get_db)
):
    return await DeletePresentation.delete_video(
        upload_dir=UPLOAD_DIR,
        presentation_id=presentation_id,
        current_user=current_user,
        db=db
    )

@router.patch("/{presentation_id}/toggle-visibility")
async def toggle_presentation_visibility(
    presentation_id: int,
    current_user: User = Depends(TokenHandler.get_current_user),
    db: Session = Depends(get_db)
):
    return await ToggleVisibility.toggle_visibility(presentation_id, current_user, db)
