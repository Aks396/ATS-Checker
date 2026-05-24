from pydantic import BaseModel
from datetime import datetime

class ChatMessageCreate(BaseModel):
    content: str

class ChatMessageResponse(BaseModel):
    id: int
    user_id: int
    resume_id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True
