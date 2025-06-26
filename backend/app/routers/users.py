from fastapi import APIRouter, status, Depends, Form, Body
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.app.models.user.user import User
from backend.app.schemas.user.user_schema import UserResponse, UserUpdate, UserProfileResponse
from backend.app.utils.token_handler import TokenHandler
from backend.app.controllers.user.edit_user import EditUser

router = APIRouter(prefix="/users", tags=["user"])

@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(current_user: User = Depends(TokenHandler.get_current_user), db: Session = Depends(get_db)):
    user_with_presentations = db.query(User).filter(User.id == current_user.id).first()
    return user_with_presentations


@router.put("/edit", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate = Body(...),
    current_user: User = Depends(TokenHandler.get_current_user),
    db: Session = Depends(get_db)
):
    return await EditUser.edit_user(
        user_update=user_update, 
        current_user=current_user, 
        db=db
    )
