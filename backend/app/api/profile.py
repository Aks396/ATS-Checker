import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.models.resume import Resume
from backend.app.models.job_match import JobMatch
from backend.app.models.ats_report import ATSReport
from backend.app.models.interview import MockInterview
from backend.app.auth.jwt import get_current_user
from backend.app.ai.gemini_client import get_gemini_model, HAS_API_KEY

router = APIRouter(prefix="/profile", tags=["Profile"])


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class ProfileUpdateRequest(BaseModel):
    bio: Optional[str] = None
    career_title: Optional[str] = None
    target_role: Optional[str] = None
    banner_color: Optional[str] = None
    preferred_stack: Optional[List[str]] = None
    target_salary: Optional[str] = None
    experience_level: Optional[str] = None
    remote_preference: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None


# ── Helper: Calculate XP + Level ─────────────────────────────────────────────

def _compute_xp_and_level(
    total_resumes: int,
    total_matches: int,
    total_interviews: int,
    avg_ats: float,
    profile_pct: float
) -> tuple[int, str]:
    """Compute XP points and career level based on platform activity."""
    xp = 0
    xp += total_resumes * 10      # 10 XP per resume uploaded
    xp += total_matches * 5       # 5 XP per job match run
    xp += total_interviews * 20   # 20 XP per mock interview session
    if avg_ats >= 70:
        xp += 25                  # Bonus: high ATS average
    if avg_ats >= 85:
        xp += 50                  # Elite bonus
    if profile_pct >= 80:
        xp += 30                  # Bonus: filled-in profile

    if xp >= 500:
        level = "Principal"
    elif xp >= 300:
        level = "Lead"
    elif xp >= 150:
        level = "Senior"
    elif xp >= 60:
        level = "Mid"
    else:
        level = "Junior"

    return xp, level


# ── Helper: Compute Profile Completion % ─────────────────────────────────────

def _profile_completion(user: User) -> int:
    """Returns 0-100% based on how many optional profile fields are filled."""
    fields = [
        user.bio,
        user.career_title,
        user.target_role,
        user.preferred_stack,
        user.target_salary,
        user.experience_level,
        user.remote_preference,
        user.linkedin_url,
        user.github_url,
        user.portfolio_url,
    ]
    filled = sum(1 for f in fields if f)
    return round((filled / len(fields)) * 100)


# ── Helper: Unlocked Achievement Badges ──────────────────────────────────────

def _compute_badges(
    total_resumes: int,
    total_matches: int,
    total_interviews: int,
    highest_ats: float,
    profile_pct: int,
    xp: int
) -> List[Dict]:
    badges = []

    def _badge(id_, name, desc, icon, color, unlocked):
        return {"id": id_, "name": name, "description": desc, "icon": icon, "color": color, "unlocked": unlocked}

    badges.append(_badge("first_upload", "First Steps", "Upload your first resume", "UploadCloud",
                          "text-purple-400", total_resumes >= 1))
    badges.append(_badge("ats_master", "ATS Master", "Achieve an ATS score ≥ 80", "ShieldCheck",
                          "text-emerald-400", highest_ats >= 80))
    badges.append(_badge("ats_elite", "ATS Elite", "Achieve an ATS score ≥ 90", "Award",
                          "text-yellow-400", highest_ats >= 90))
    badges.append(_badge("resume_optimizer", "Resume Optimizer", "Upload 3+ resumes", "FileText",
                          "text-cyan-400", total_resumes >= 3))
    badges.append(_badge("job_hunter", "Job Hunter", "Run 5+ job description matches", "Briefcase",
                          "text-blue-400", total_matches >= 5))
    badges.append(_badge("interview_champion", "Interview Champion", "Complete 3+ mock interviews", "Mic",
                          "text-amber-400", total_interviews >= 3))
    badges.append(_badge("profile_complete", "Profile Complete", "Fill 80%+ of your profile", "UserCheck",
                          "text-pink-400", profile_pct >= 80))
    badges.append(_badge("career_veteran", "Career Veteran", "Reach Senior level (150+ XP)", "TrendingUp",
                          "text-orange-400", xp >= 150))

    return badges


# ── Endpoint 1: GET /api/profile/me ──────────────────────────────────────────

@router.get("/me")
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Returns the full profile of the authenticated user."""
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "profile_image": current_user.profile_image,
        "bio": current_user.bio,
        "career_title": current_user.career_title,
        "target_role": current_user.target_role,
        "banner_color": current_user.banner_color or "from-purple-600 via-blue-600 to-cyan-500",
        "preferred_stack": current_user.preferred_stack or [],
        "target_salary": current_user.target_salary,
        "experience_level": current_user.experience_level or "mid",
        "remote_preference": current_user.remote_preference or "remote",
        "linkedin_url": current_user.linkedin_url,
        "github_url": current_user.github_url,
        "portfolio_url": current_user.portfolio_url,
        "ai_career_score": current_user.ai_career_score or 0.0,
        "recruiter_visibility_score": current_user.recruiter_visibility_score or 0.0,
        "xp_points": current_user.xp_points or 0,
        "career_level": current_user.career_level or "Junior",
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
    }


# ── Endpoint 2: PATCH /api/profile/me ────────────────────────────────────────

@router.patch("/me")
def update_my_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Updates the profile of the authenticated user."""
    update_data = payload.model_dump(exclude_none=True)

    for field, value in update_data.items():
        if hasattr(current_user, field):
            setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)

    return {"success": True, "message": "Profile updated successfully."}


# ── Endpoint 3: GET /api/profile/stats ───────────────────────────────────────

@router.get("/stats")
def get_profile_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Returns aggregated career analytics and gamification stats for the authenticated user."""
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).all()
    matches = db.query(JobMatch).filter(JobMatch.user_id == current_user.id).all()
    interviews = db.query(MockInterview).filter(MockInterview.user_id == current_user.id).all()

    total_resumes = len(resumes)
    total_matches = len(matches)
    total_interviews = len(interviews)

    avg_ats = round(sum(r.ats_score for r in resumes) / total_resumes, 1) if total_resumes > 0 else 0.0
    highest_ats = round(max((r.ats_score for r in resumes), default=0.0), 1)

    # Score progression for trend chart
    score_progression = [
        {
            "name": r.filename[:12] + "..." if len(r.filename) > 12 else r.filename,
            "score": round(r.ats_score, 1),
            "date": r.created_at.strftime("%b %d") if r.created_at else ""
        }
        for r in sorted(resumes, key=lambda x: x.created_at)
    ]

    # Skills aggregated across all resumes
    skills_map: Dict[str, int] = {}
    for r in resumes:
        if r.parsed_json and "skills" in r.parsed_json:
            for s in r.parsed_json["skills"]:
                norm = s.strip().title()
                skills_map[norm] = skills_map.get(norm, 0) + 1

    top_skills = sorted(skills_map.items(), key=lambda x: x[1], reverse=True)[:20]
    skills_list = [{"name": k, "count": v} for k, v in top_skills]

    # Activity timeline (last 10 events mixed)
    timeline = []
    for r in resumes:
        timeline.append({
            "type": "resume_upload",
            "title": f"Uploaded {r.filename}",
            "meta": f"ATS Score: {round(r.ats_score)}%",
            "time": r.created_at.isoformat() if r.created_at else ""
        })
    for m in matches:
        timeline.append({
            "type": "job_match",
            "title": f"Matched: {m.job_title or 'Unknown Role'}",
            "meta": f"Match Score: {round(m.match_score)}%",
            "time": m.created_at.isoformat() if m.created_at else ""
        })
    for iv in interviews:
        timeline.append({
            "type": "interview",
            "title": f"Mock Interview: {iv.role or 'General'}",
            "meta": "STAR framework session completed",
            "time": iv.created_at.isoformat() if iv.created_at else ""
        })
    timeline = sorted(timeline, key=lambda x: x["time"], reverse=True)[:12]

    # Compute profile completion
    profile_pct = _profile_completion(current_user)

    # Compute XP and career level
    xp, level = _compute_xp_and_level(
        total_resumes, total_matches, total_interviews, avg_ats, profile_pct
    )

    # Compute recruiter visibility (ATS-based heuristic)
    recruiter_vis = min(100.0, round(
        (avg_ats * 0.5) + (profile_pct * 0.3) + (min(total_matches, 10) * 2.0), 1
    ))

    # Compute AI career score
    ai_career = min(100.0, round(
        (avg_ats * 0.4) + (min(xp, 300) / 300 * 40) + (profile_pct * 0.2), 1
    ))

    # Persist computed scores and XP back to user
    current_user.xp_points = xp
    current_user.career_level = level
    current_user.recruiter_visibility_score = recruiter_vis
    current_user.ai_career_score = ai_career
    db.commit()

    # Compute badges
    badges = _compute_badges(
        total_resumes, total_matches, total_interviews, highest_ats, profile_pct, xp
    )

    # Resumes summary for resume section
    resumes_summary = [
        {
            "id": r.id,
            "filename": r.filename,
            "ats_score": round(r.ats_score, 1),
            "created_at": r.created_at.isoformat() if r.created_at else "",
            "skills_count": len(r.parsed_json.get("skills", [])) if r.parsed_json else 0
        }
        for r in sorted(resumes, key=lambda x: x.created_at, reverse=True)[:5]
    ]

    return {
        "total_resumes": total_resumes,
        "total_matches": total_matches,
        "total_interviews": total_interviews,
        "avg_ats_score": avg_ats,
        "highest_ats_score": highest_ats,
        "profile_completion": profile_pct,
        "xp_points": xp,
        "career_level": level,
        "recruiter_visibility_score": recruiter_vis,
        "ai_career_score": ai_career,
        "score_progression": score_progression,
        "top_skills": skills_list,
        "timeline": timeline,
        "badges": badges,
        "resumes_summary": resumes_summary,
    }


# ── Endpoint 4: GET /api/profile/insights ────────────────────────────────────

@router.get("/insights")
def get_profile_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Returns AI-generated career insights for the authenticated user via Gemini."""
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).all()

    if not resumes:
        return {
            "strengths": [],
            "improvements": [],
            "next_step": "Upload your first resume to unlock AI career coaching insights.",
            "readiness_summary": "No resume data available yet.",
            "generated_bio": None,
        }

    # Build a context string from the most recent resume
    latest = sorted(resumes, key=lambda x: x.created_at, reverse=True)[0]
    pj = latest.parsed_json or {}
    skills = pj.get("skills", [])
    experience = pj.get("experience", [])
    target = current_user.target_role or "Senior Software Engineer"
    avg_ats = round(sum(r.ats_score for r in resumes) / len(resumes), 1)

    if HAS_API_KEY:
        try:
            model = get_gemini_model("gemini-1.5-flash")
            prompt = f"""
You are an elite AI Career Coach reviewing a software engineer's profile on a career intelligence platform.

Candidate: {current_user.name}
Current ATS Score: {avg_ats}%
Target Role: {target}
Skills: {', '.join(skills[:15])}
Experience: {len(experience)} role(s) listed
Career Title: {current_user.career_title or 'Not specified'}

Generate a structured career coaching response. Return ONLY valid JSON in this exact schema:
{{
    "strengths": ["Strength 1", "Strength 2", "Strength 3"],
    "improvements": ["Improvement 1", "Improvement 2", "Improvement 3"],
    "next_step": "One concrete, specific next action this candidate should take to advance their career.",
    "readiness_summary": "2-3 sentence overall career readiness assessment with specific feedback.",
    "generated_bio": "A 2-sentence professional bio written in first person for this candidate's LinkedIn/portfolio."
}}
"""
            response = model.generate_content(prompt)
            raw = response.text.strip()
            # Strip markdown code fences if present
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            insights = json.loads(raw.strip())
            return insights
        except Exception as e:
            print(f"Gemini insights error: {e}")

    # Offline fallback
    fallback_strengths = []
    if len(skills) >= 8:
        fallback_strengths.append(f"Strong technical breadth with {len(skills)} documented skills")
    if experience:
        fallback_strengths.append(f"Professional experience across {len(experience)} role(s)")
    if avg_ats >= 70:
        fallback_strengths.append(f"Above-average ATS compatibility score of {avg_ats}%")
    if not fallback_strengths:
        fallback_strengths = ["Committed to career development by using AI-powered tools"]

    return {
        "strengths": fallback_strengths[:3],
        "improvements": [
            f"Target role is '{target}' — ensure all bullet points align to that role's requirements",
            "Add quantifiable metrics (%, $, hours saved) to each experience entry",
            "Expand skills list to include cloud platforms (AWS, GCP) and DevOps tooling"
        ],
        "next_step": f"Tailor your resume specifically to '{target}' job descriptions using the Job Matching tool, then re-upload to see your score improve.",
        "readiness_summary": f"Your profile shows solid fundamentals with an ATS score of {avg_ats}%. With targeted optimizations to keyword density and experience quantification, you could reach 85%+ and significantly improve recruiter pipeline conversion.",
        "generated_bio": f"I'm {current_user.name}, a {current_user.career_title or 'software engineer'} with a strong foundation in {', '.join(skills[:3]) if skills else 'full-stack development'}. I'm actively targeting {target} roles where I can drive technical impact at scale."
    }
