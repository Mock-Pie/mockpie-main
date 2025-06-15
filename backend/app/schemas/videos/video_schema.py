from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class VideoUploadResponse(BaseModel):
    message: str
    presentation_id: int
    title: str
    filename: str
    original_filename: str
    file_url: str
    file_size: int
    uploaded_at: str
    content_type: str

class VideoInfo(BaseModel):
    id: int
    title: str
    url: str
    uploaded_at: str

class VideoListResponse(BaseModel):
    videos: list[VideoInfo]
    total: int
    skip: int
    limit: int

class VideoDetailsResponse(BaseModel):
    id: int
    title: str
    url: str
    uploaded_at: str
    file_info: dict

class VideoDeleteResponse(BaseModel):
    message: str
    presentation_id: int
