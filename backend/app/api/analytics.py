from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.models.resume import Resume
from backend.app.models.job_match import JobMatch
from backend.app.auth.jwt import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard", response_model=Dict[str, Any])
def get_dashboard_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch all user's resumes
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.created_at.asc()).all()
    matches = db.query(JobMatch).filter(JobMatch.user_id == current_user.id).all()
    
    total_resumes = len(resumes)
    total_matches = len(matches)
    
    if total_resumes == 0:
        return {
            "total_resumes": 0,
            "total_matches": 0,
            "avg_ats_score": 0.0,
            "highest_ats_score": 0.0,
            "score_progression": [],
            "skills_distribution": [],
            "recent_activity": []
        }
        
    avg_score = round(sum(r.ats_score for r in resumes) / total_resumes, 1)
    highest_score = max(r.ats_score for r in resumes)
    
    # 1. Score Progression (for Recharts Area/Line Chart)
    score_progression = []
    for r in resumes:
        score_progression.append({
            "name": r.filename if len(r.filename) <= 15 else r.filename[:12] + "...",
            "score": r.ats_score,
            "date": r.created_at.strftime("%b %d")
        })
        
    # 2. Skills Distribution (for Radar/Bar Charts)
    skills_map = {}
    for r in resumes:
        if r.parsed_json and "skills" in r.parsed_json:
            for skill in r.parsed_json["skills"]:
                normalized = skill.title().strip()
                skills_map[normalized] = skills_map.get(normalized, 0) + 1
                
    # Sort skills by count and grab top 7
    sorted_skills = sorted(skills_map.items(), key=lambda x: x[1], reverse=True)[:7]
    skills_distribution = [{"subject": k, "count": v, "fullMark": 5} for k, v in sorted_skills]
    if not skills_distribution:
        # Default skills if none extracted yet
        skills_distribution = [
            {"subject": "Software Dev", "count": 0, "fullMark": 5},
            {"subject": "SQL Databases", "count": 0, "fullMark": 5},
            {"subject": "APIs", "count": 0, "fullMark": 5}
        ]

    # 3. Recent Activity List
    recent_activity = []
    # Mix resumes and matches, sort by date
    for r in resumes[-3:]:
        recent_activity.append({
            "type": "upload",
            "title": f"Uploaded {r.filename}",
            "description": f"Overall ATS Score: {r.ats_score}%",
            "time": r.created_at.strftime("%Y-%m-%d %H:%M")
        })
    for m in matches[-3:]:
        recent_activity.append({
            "type": "match",
            "title": f"Matched for {m.job_title}",
            "description": f"Semantic alignment: {m.match_score}%",
            "time": m.created_at.strftime("%Y-%m-%d %H:%M")
        })
        
    # Sort by time desc and take top 5
    recent_activity = sorted(recent_activity, key=lambda x: x["time"], reverse=True)[:5]

    return {
        "total_resumes": total_resumes,
        "total_matches": total_matches,
        "avg_ats_score": avg_score,
        "highest_ats_score": highest_score,
        "score_progression": score_progression,
        "skills_distribution": skills_distribution,
        "recent_activity": recent_activity
    }
