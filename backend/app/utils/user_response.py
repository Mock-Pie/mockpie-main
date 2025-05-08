from pydantic import BaseModel, EmailStr
from datetime import datetime

from backend.app.enums.gender import Gender

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    phone_number: str
    gender: Gender
    created_at: datetime
    updated_at: datetime