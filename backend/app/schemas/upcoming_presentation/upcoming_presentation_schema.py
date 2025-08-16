from pydantic import BaseModel, validator
from datetime import datetime
from typing import Optional, List


class UpcomingPresentationBase(BaseModel):
    topic: str
    presentation_date: datetime
    
    @validator('topic')
    def topic_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Topic cannot be empty')
        return v.strip()
    
    @validator('presentation_date')
    def date_in_future(cls, v):
        if v <= datetime.now():
            raise ValueError('Presentation date must be in the future')
        return v


class UpcomingPresentationCreate(UpcomingPresentationBase):
    pass


class UpcomingPresentationResponse(BaseModel):
    id: int
    topic: str
    presentation_date: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True


class UpcomingPresentationList(BaseModel):
    upcoming_presentations: List[UpcomingPresentationResponse]
    total: int 