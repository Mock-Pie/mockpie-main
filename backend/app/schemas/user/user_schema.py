from pydantic import BaseModel, EmailStr, validator, Field
from typing import Optional
from datetime import datetime
from ...enums import Gender

# Base DTO with common attributes
class UserBase(BaseModel):
    username: str
    email: EmailStr
    phone_number: str
    gender: Gender

# DTO for creating new users (request)
class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    
    @validator('password')
    def password_strength(cls, v):
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        return v

# DTO for updating existing users (request)
class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    gender: Optional[Gender] = None
    password: Optional[str] = None

# DTO for returning user data (response)
class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True  # Formerly orm_mode=True