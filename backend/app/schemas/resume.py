from pydantic import BaseModel
from typing import Optional, Any, Dict, List
from datetime import datetime

class ResumeResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    file_url: Optional[str] = None
    parsed_text: Optional[str] = None
    parsed_json: Optional[Dict[str, Any]] = None # Holds skills, work history, education
    ats_score: float
    created_at: datetime

    class Config:
        from_attributes = True

class ResumeListResponse(BaseModel):
    id: int
    filename: str
    ats_score: float
    created_at: datetime

    class Config:
        from_attributes = True
