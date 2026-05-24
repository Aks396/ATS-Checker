import os
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import google.generativeai as genai

from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.models.resume import Resume
from backend.app.auth.jwt import get_current_user
from backend.app.ai.gemini_client import get_gemini_model, HAS_API_KEY

router = APIRouter(prefix="/recruiter", tags=["Recruiter"])

@router.get("/analyse/{resume_id}")
def analyse_resume_recruiter(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generates an AI Recruiter audit report assessing candidate tier, red flags, and fit roles."""
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    audit_report = None
    if HAS_API_KEY:
        try:
            model = get_gemini_model("gemini-1.5-flash")
            prompt = f"""
            You are an AI recruiting screening engine sorting candidates for top-tier Tech Unicorns (like Stripe, Vercel, Linear).
            Analyze this candidate's resume and generate a mock recruitment audit.
            
            Resume Text:
            ==================================
            {resume.parsed_text}
            ==================================

            Identify:
            1. candidate_tier: Choose 'Tier-1' (Elite, clear match for top tech firms), 'Tier-2' (Strong candidate, requires minor adjustments), or 'Tier-3' (Needs major revision to pass automated filters).
            2. red_flags: List specific risks, short tenures, lack of metrics, unclear tech stacks, or formatting concerns.
            3. top_fit_roles: 2-3 standard roles the profile matches best.
            4. general_recommendation: 2-3 sentences outlining the candidate's core strengths and main area for career growth.

            You MUST output a valid JSON object in this exact schema:
            {{
                "candidate_tier": "Tier-2",
                "red_flags": [
                    "Highlight point at InnoSoft Labs lacks metric-driven results.",
                    "No cloud provider (AWS/GCP/Azure) mentioned in tech stack."
                ],
                "top_fit_roles": [
                    "Full Stack Engineer",
                    "React Developer"
                ],
                "general_recommendation": "The candidate shows clean development practices and is highly qualified in Python/React, but needs to highlight scalable cloud hosting and architecture experience."
            }}
            """
            response = model.generate_content(prompt)
            audit_report = json.loads(response.text.strip())
        except Exception as e:
            print(f"Error calling Gemini in recruiter analysis: {e}")
            audit_report = None

    if not audit_report:
        # Offline/error fallback recruiter screen analysis
        pj = resume.parsed_json or {}
        skills = pj.get("skills", [])
        experience = pj.get("experience", [])
        
        red_flags = []
        # Checks
        if len(skills) < 6:
            red_flags.append("Skills inventory contains fewer than 6 entries. Expand technical capabilities list.")
        
        has_quantification = False
        for exp in experience:
            for h in exp.get("highlights", []):
                if "%" in h or "percent" in h or any(c.isdigit() for c in h if c not in ["2", "0", "1", "3", "4", "5", "6", "7", "8", "9"]): # generic check
                    has_quantification = True
                    
        if not has_quantification:
            red_flags.append("No quantifiable metrics (%, dollar values, hours saved) detected in work experience highlights.")
            
        if not pj.get("projects"):
            red_flags.append("No technical projects listed. Recruiter review favors active side-projects demonstrating skill application.")

        # Determine Tier
        score = resume.ats_score
        if score >= 80 and len(red_flags) == 0:
            tier = "Tier-1"
        elif score >= 60:
            tier = "Tier-2"
        else:
            tier = "Tier-3"

        # Fit roles
        fit_roles = []
        skills_lower = [s.lower() for s in skills]
        if "react" in skills_lower or "javascript" in skills_lower or "typescript" in skills_lower:
            fit_roles.append("Frontend Developer")
        if "python" in skills_lower or "fastapi" in skills_lower or "sql" in skills_lower or "node" in skills_lower:
            fit_roles.append("Backend Developer")
        if not fit_roles:
            fit_roles = ["Software Engineer", "Systems Analyst"]

        audit_report = {
            "candidate_tier": tier,
            "red_flags": red_flags if red_flags else ["No high-priority recruiter red flags detected."],
            "top_fit_roles": fit_roles[:2],
            "general_recommendation": f"Candidate demonstrates solid fundamentals with an ATS score of {round(score)}%. To elevate their profile, they should focus on addressing the identified gaps in experience bullet points."
        }

    return audit_report
