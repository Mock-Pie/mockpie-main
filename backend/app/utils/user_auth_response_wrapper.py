from pydantic import BaseModel

from backend.app.utils.user_response import UserResponse

class UserAuthResponse(BaseModel):
    token: str
    user: UserResponse