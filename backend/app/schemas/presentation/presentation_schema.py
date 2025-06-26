from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class PresentationBase(BaseModel):
    title: str
    url: str


class PresentationResponse(BaseModel):
    id: int
    title: str
    url: str
    is_public: bool = False
    uploaded_at: datetime
    has_voice_analysis: bool = False
    has_body_analysis: bool = False
    
    class Config:
        from_attributes = True
        
        
class PresentationCreate(PresentationBase):
    user_id: int
        

class PresentationUpdate(PresentationBase):
    pass