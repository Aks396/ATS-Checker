from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ApplicationTaskCreate(BaseModel):
    title: str
    due_date: Optional[datetime] = None

class ApplicationTaskResponse(BaseModel):
    id: int
    application_id: int
    title: str
    is_completed: bool
    due_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class JobApplicationCreate(BaseModel):
    company: str
    title: str
    status: Optional[str] = "wishlist"
    job_description: Optional[str] = None
    salary: Optional[str] = None
    location: Optional[str] = None
    url: Optional[str] = None
    resume_id: Optional[int] = None

class JobApplicationUpdate(BaseModel):
    company: Optional[str] = None
    title: Optional[str] = None
    status: Optional[str] = None
    job_description: Optional[str] = None
    salary: Optional[str] = None
    location: Optional[str] = None
    url: Optional[str] = None
    resume_id: Optional[int] = None

class JobApplicationResponse(BaseModel):
    id: int
    user_id: int
    resume_id: Optional[int] = None
    company: str
    title: str
    status: str
    job_description: Optional[str] = None
    salary: Optional[str] = None
    location: Optional[str] = None
    url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    tasks: List[ApplicationTaskResponse] = []
    match_score: Optional[float] = 0.0

    class Config:
        from_attributes = True
