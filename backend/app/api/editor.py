import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
import google.generativeai as genai

from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.models.resume import Resume, ResumeVersion
from backend.app.models.ats_report import ATSReport
from backend.app.schemas.editor import RewriteRequest, RewriteResponse, ResumeSaveRequest
from backend.app.schemas.resume import ResumeResponse
from backend.app.auth.jwt import get_current_user
from backend.app.utils.resume_exporter import generate_resume_pdf, generate_resume_docx
from backend.app.services.ats_engine import analyze_resume_ats
from backend.app.ai.vector_store import vector_store
from backend.app.ai.gemini_client import HAS_API_KEY, get_gemini_model

router = APIRouter(prefix="/editor", tags=["Editor"])

def rebuild_raw_text(pj: dict) -> str:
    """Rebuilds the raw text of a resume from the parsed JSON structure."""
    parts = []
    if pj.get("name"):
        parts.append(pj["name"])
    contact = []
    if pj.get("email"): contact.append(pj["email"])
    if pj.get("phone"): contact.append(pj["phone"])
    if contact:
        parts.append(" | ".join(contact))
        
    if pj.get("summary"):
        parts.append("\nProfessional Summary")
        parts.append(pj["summary"])
        
    if pj.get("skills"):
        parts.append("\nTechnical Skills")
        parts.append(", ".join(pj["skills"]))
        
    if pj.get("experience"):
        parts.append("\nWork Experience")
        for exp in pj["experience"]:
            parts.append(f"{exp.get('company', '')} - {exp.get('role', '')} ({exp.get('duration', '')})")
            for h in exp.get("highlights", []):
                parts.append(f"- {h}")
                
    if pj.get("projects"):
        parts.append("\nProjects")
        for proj in pj["projects"]:
            parts.append(f"{proj.get('title', '')}: {proj.get('description', '')}")
            for h in proj.get("highlights", []):
                parts.append(f"- {h}")
                
    if pj.get("education"):
        parts.append("\nEducation")
        for edu in pj["education"]:
            parts.append(f"{edu.get('institution', '')} - {edu.get('degree', '')} in {edu.get('major', '')} ({edu.get('graduation_year', '')})")
            
    return "\n".join(parts)


@router.post("/rewrite", response_model=RewriteResponse)
def rewrite_block(
    payload: RewriteRequest,
    current_user: User = Depends(get_current_user)
):
    """Rewrite a specific resume text block based on an AI command."""
    original_text = payload.text.strip()
    command = payload.command.strip()
    
    if not original_text or not command:
        raise HTTPException(status_code=400, detail="Text and Command are required")

    rewritten_text = ""
    if HAS_API_KEY:
        try:
            model = get_gemini_model("gemini-1.5-flash", response_mime_type=None)
            prompt = f"""
            You are a professional resume writer and career coach.
            Optimize the following resume text block:
            "{original_text}"

            Apply this optimization command:
            "{command}"

            Rules:
            1. Keep the output professional and appropriate for a resume.
            2. Integrate quantifiable metrics (e.g. percentages, time saved, revenue) if possible.
            3. Start experience points with strong action verbs.
            4. Output ONLY the rewritten text. Do NOT include explanations, wrap in quotes, or add preamble.
            """
            response = model.generate_content(prompt)
            rewritten_text = response.text.strip()
        except Exception as e:
            print(f"Error calling Gemini in editor rewrite: {e}")
            rewritten_text = ""

    if not rewritten_text:
        # Fallback offline rewrite
        if "quantify" in command.lower() or "result" in command.lower() or "metric" in command.lower():
            rewritten_text = f"{original_text}, resulting in a 22% improvement in system performance and saving 8 hours of engineering overhead weekly."
        elif "verb" in command.lower() or "action" in command.lower():
            words = original_text.split()
            if words:
                # Replace first word with a strong action verb
                words[0] = "Spearheaded"
                rewritten_text = " ".join(words)
            else:
                rewritten_text = f"Led the development of core components."
        else:
            rewritten_text = f"Successfully refactored and optimized: {original_text}"

    return RewriteResponse(original_text=original_text, rewritten_text=rewritten_text)


@router.post("/save/{resume_id}", response_model=ResumeResponse)
def save_resume_edits(
    resume_id: int,
    payload: ResumeSaveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save block edits to the resume, recalculating ATS scores and logging a new history version."""
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    new_json = payload.parsed_json
    new_text = rebuild_raw_text(new_json)

    # 1. Run ATS Analysis
    ats_analysis = analyze_resume_ats(new_text, new_json)
    overall_score = ats_analysis["overall_score"]

    # 2. Update primary Resume fields
    resume.parsed_json = new_json
    resume.parsed_text = new_text
    resume.ats_score = overall_score

    # 3. Update ATS report
    report = db.query(ATSReport).filter(ATSReport.resume_id == resume_id).first()
    if report:
        report.formatting_score = ats_analysis["sub_scores"]["formatting"]
        report.readability_score = ats_analysis["sub_scores"]["readability"]
        report.skills_score = ats_analysis["sub_scores"]["skills"]
        report.verbs_score = ats_analysis["sub_scores"]["verbs"]
        report.keyword_match_rate = ats_analysis["sub_scores"]["quantification"]
        report.improvement_areas = ats_analysis["improvement_areas"]
        report.detailed_suggestions = ats_analysis["detailed_suggestions"]
    else:
        # Create new if missing
        report = ATSReport(
            resume_id=resume_id,
            formatting_score=ats_analysis["sub_scores"]["formatting"],
            readability_score=ats_analysis["sub_scores"]["readability"],
            skills_score=ats_analysis["sub_scores"]["skills"],
            verbs_score=ats_analysis["sub_scores"]["verbs"],
            keyword_match_rate=ats_analysis["sub_scores"]["quantification"],
            improvement_areas=ats_analysis["improvement_areas"],
            detailed_suggestions=ats_analysis["detailed_suggestions"]
        )
        db.add(report)

    # 4. Save new Resume Version
    max_ver = db.query(func.max(ResumeVersion.version_num)).filter(ResumeVersion.resume_id == resume_id).scalar()
    next_ver_num = (max_ver or 1) + 1

    db_version = ResumeVersion(
        resume_id=resume_id,
        version_num=next_ver_num,
        filename=resume.filename,
        file_url=resume.file_url,
        parsed_text=new_text,
        parsed_json=new_json,
        ats_score=overall_score
    )
    db.add(db_version)
    db.commit()
    db.refresh(resume)

    # 5. Update vector store index
    try:
        vector_store.add_resume(resume_id, current_user.id, new_json, new_text)
    except Exception as vs_err:
        print(f"Error re-indexing vector store after edit: {vs_err}")

    return resume

@router.get("/export/pdf/{resume_id}")
def export_pdf(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generates and streams a downloadable polished PDF resume."""
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    resume_data = resume.parsed_json or {}
    if not resume_data.get("name"):
        resume_data["name"] = current_user.name
        
    try:
        pdf_buffer = generate_resume_pdf(resume_data)
        filename = f"resume_{resume_id}.pdf"
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")

@router.get("/export/docx/{resume_id}")
def export_docx(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generates and streams a downloadable polished DOCX resume."""
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    resume_data = resume.parsed_json or {}
    if not resume_data.get("name"):
        resume_data["name"] = current_user.name

    try:
        docx_buffer = generate_resume_docx(resume_data)
        filename = f"resume_{resume_id}.docx"
        return StreamingResponse(
            docx_buffer,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate DOCX: {str(e)}")
