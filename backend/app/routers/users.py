from fastapi import APIRouter, status, Depends, Form, Body, HTTPException
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.app.models.user.user import User
from backend.app.schemas.user.user_schema import UserResponse, UserUpdate, UserProfileResponse
from backend.app.utils.token_handler import TokenHandler
from backend.app.controllers.user.edit_user import EditUser
from backend.app.controllers.user.delete_user import DeleteUser
from backend.app.controllers.user.retrieve_user import RetrieveUser

router = APIRouter(prefix="/users", tags=["user"])

@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(current_user: User = Depends(TokenHandler.get_current_user), db: Session = Depends(get_db)):
    user_with_presentations = db.query(User).filter(User.id == current_user.id, User.deleted_at == None).first()
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

@router.delete("/", status_code=status.HTTP_200_OK)
async def delete_user(
    current_user: User = Depends(TokenHandler.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete the current user and all associated data (soft delete)
    """
    result = await DeleteUser.delete_user(user_id=current_user.id, db=db)
    if result["status"] == "error":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result["message"])
    return result

@router.post("/retrieve", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def retrieve_user(
    email: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Reactivate a deleted user account and all associated presentations and analyses.
    Only accounts deleted within the last 30 days can be reactivated.
    """
    return await RetrieveUser.get_user(email=email, db=db)