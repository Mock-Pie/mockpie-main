from pydantic import BaseModel
from typing import List
from datetime import datetime
from backend.app.schemas.user.user_schema import UserResponse
from backend.app.schemas.presentation.presentation_schema import PresentationResponse


class UserProfileResponse(UserResponse):
    """Extended User schema with presentations included"""
    presentations: List[PresentationResponse] = []
    
    class Config:
        from_attributes = True
