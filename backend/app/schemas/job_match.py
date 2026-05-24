from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime

class JobMatchRequest(BaseModel):
    job_title: Optional[str] = Field(None, max_length=255)
    job_description: str = Field(..., min_length=20)

class JobMatchResponse(BaseModel):
    id: int
    resume_id: int
    job_title: Optional[str] = None
    job_description: str
    match_score: float
    missing_skills: Optional[List[str]] = []
    keyword_gaps: Optional[List[str]] = []
    suggestions: Optional[Any] = None
    created_at: datetime

    class Config:
        from_attributes = True
