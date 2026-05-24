from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class ATSReportResponse(BaseModel):
    id: int
    resume_id: int
    formatting_score: float
    readability_score: float
    skills_score: float
    verbs_score: float
    keyword_match_rate: float
    improvement_areas: Optional[List[str]] = []
    detailed_suggestions: Optional[Any] = None
    created_at: datetime

    class Config:
        from_attributes = True
