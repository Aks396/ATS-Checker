from pydantic import BaseModel
from typing import Dict, Any

class RewriteRequest(BaseModel):
    text: str
    command: str

class RewriteResponse(BaseModel):
    original_text: str
    rewritten_text: str

class ResumeSaveRequest(BaseModel):
    parsed_json: Dict[str, Any]
