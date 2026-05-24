import json
import urllib.request
import urllib.parse
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.models.resume import Resume
from backend.app.auth.jwt import get_current_user

router = APIRouter(prefix="/jobs", tags=["Job Search"])

@router.get("/search")
def search_realtime_jobs(
    query: str,
    resume_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetches real-time remote jobs from Remotive API and computes matching alignment
    scores against the candidate's active resume.
    """
    if not query.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty")

    # 1. Fetch remote jobs from Remotive
    encoded_query = urllib.parse.quote(query.strip())
    url = f"https://remotive.com/api/remote-jobs?search={encoded_query}&limit=20"
    
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req, timeout=8) as response:
            res_data = json.loads(response.read().decode())
            jobs_list = res_data.get("jobs", [])
    except Exception as e:
        print(f"Error fetching jobs from Remotive: {e}")
        # Fallback empty list or mock list to prevent failure
        jobs_list = []

    # 2. Retrieve candidate resume if provided
    skills = []
    if resume_id:
        resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
        if resume and resume.parsed_json:
            skills = resume.parsed_json.get("skills", [])
            # Lowercase for matching
            skills = [s.lower() for s in skills if s.strip()]

    # 3. Calculate alignment match score for each job
    processed_jobs = []
    for job in jobs_list:
        title = job.get("title", "").lower()
        desc = job.get("description", "").lower()
        company = job.get("company_name", "Unknown Company")
        
        match_score = 0.0
        matched_skills = []
        missing_skills = []
        
        if skills:
            # Check how many skills appear in job description/title
            matches = 0
            for skill in skills:
                # Use word boundaries or simple string search for matching
                if skill in title or f" {skill} " in f" {desc} ":
                    matches += 1
                    matched_skills.append(skill.title())
                else:
                    missing_skills.append(skill.title())
            
            # Simple match scoring formula:
            # Base score 35.0, add 10 points per matching skill, limit to 95.0
            if matches > 0:
                match_score = min(95.0, 35.0 + (matches * 10.0))
                # Extra bonus if skill in job title
                for skill in skills:
                    if skill in title:
                        match_score = min(99.0, match_score + 5.0)
            else:
                # Default minimal compatibility index
                match_score = 15.0

        # Build response item
        # Strip description HTML tags to make it clean for the frontend
        raw_desc = job.get("description", "")
        # Remove HTML tags using simple regex
        import re
        clean_desc = re.sub('<[^<]+?>', '', raw_desc)
        # Limit description to 200 chars for overview
        short_desc = clean_desc[:250] + "..." if len(clean_desc) > 250 else clean_desc

        processed_jobs.append({
            "id": job.get("id"),
            "title": job.get("title"),
            "company": company,
            "category": job.get("category"),
            "location": job.get("candidate_required_location", "Remote"),
            "salary": job.get("salary", "N/A"),
            "url": job.get("url"),
            "logo": job.get("company_logo"),
            "description": short_desc,
            "full_description": clean_desc,
            "match_score": round(match_score, 1),
            "matched_skills": matched_skills,
            "missing_skills": missing_skills[:6] # Limit missing skills to top 6
        })

    # Sort jobs by match score descending (highest score first)
    if resume_id:
        processed_jobs.sort(key=lambda x: x["match_score"], reverse=True)

    return processed_jobs
