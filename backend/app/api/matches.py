from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.models.resume import Resume
from backend.app.models.job_match import JobMatch
from backend.app.schemas.job_match import JobMatchRequest, JobMatchResponse
from backend.app.auth.jwt import get_current_user
from backend.app.ai.gemini_client import match_job_with_gemini

router = APIRouter(prefix="/matches", tags=["Job Matching"])

@router.post("/{resume_id}", response_model=JobMatchResponse, status_code=status.HTTP_201_CREATED)
def match_job_description(
    resume_id: int,
    request: JobMatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify resume belongs to user
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )

    # Perform analysis using Gemini
    try:
        match_data = match_job_with_gemini(resume.parsed_text, request.job_description)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing AI matching engine: {str(e)}"
        )

    # Save match results to database
    db_match = JobMatch(
        user_id=current_user.id,
        resume_id=resume.id,
        job_title=request.job_title or "Untitled Position",
        job_description=request.job_description,
        match_score=match_data.get("match_score", 0.0),
        missing_skills=match_data.get("missing_skills", []),
        keyword_gaps=match_data.get("keyword_gaps", []),
        suggestions=match_data.get("suggestions", [])
    )
    db.add(db_match)
    db.commit()
    db.refresh(db_match)

    return db_match

@router.get("/resume/{resume_id}", response_model=List[JobMatchResponse])
def get_resume_matches(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify resume belongs to user
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
        
    matches = db.query(JobMatch).filter(JobMatch.resume_id == resume_id).order_by(JobMatch.created_at.desc()).all()
    return matches
