from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class MockInterviewStartRequest(BaseModel):
    resume_id: int
    job_title: Optional[str] = None
    job_description: Optional[str] = None

class MockInterviewTurnRequest(BaseModel):
    content: str

class MockInterviewTurnResponse(BaseModel):
    id: int
    interview_id: int
    role: str
    content: str
    feedback: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class MockInterviewResponse(BaseModel):
    id: int
    user_id: int
    resume_id: int
    job_title: Optional[str] = None
    job_description: Optional[str] = None
    created_at: datetime
    turns: List[MockInterviewTurnResponse] = []

    class Config:
        from_attributes = True
