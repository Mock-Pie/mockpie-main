from pydantic import BaseModel, EmailStr, field_validator, Field
from typing import Optional
from datetime import datetime
from backend.app.enums.gender import Gender

class UserBase(BaseModel):
    username: str
    email: EmailStr
    phone_number: str
    gender: Gender

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    password: Optional[str] = None
    
class UserRegistration(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    phone_number: str = Field(..., pattern=r'^\+?[1-9]\d{1,14}$')
    password: str = Field(..., min_length=8)
    password_confirmation: str
    gender: Gender

    
    @field_validator('password')
    def password_strength(cls, v):
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        return v
    
class UserLogin(BaseModel):
    email: EmailStr
    phone: Optional[str] = None
    username: Optional[str] = None
    password: str = Field(..., min_length=8)
    
    @field_validator('password')
    def password_strength(cls, v):
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        return v
