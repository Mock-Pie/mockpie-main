from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class PresentationBase(BaseModel):
    title: str
    url: str
    language: Optional[str] = None
    topic: Optional[str] = None


class PresentationResponse(BaseModel):
    id: int
    title: str
    url: str
    language: Optional[str] = None
    topic: Optional[str] = None
    is_public: bool = False
    uploaded_at: datetime
    
    class Config:
        from_attributes = True
        
        
class PresentationCreate(PresentationBase):
    user_id: int
        

class PresentationUpdate(PresentationBase):
    pass