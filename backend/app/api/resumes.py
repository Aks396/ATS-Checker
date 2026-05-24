import os
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.models.resume import Resume, ResumeVersion
from backend.app.models.ats_report import ATSReport
from backend.app.schemas.resume import ResumeResponse, ResumeListResponse
from backend.app.schemas.ats_report import ATSReportResponse
from backend.app.auth.jwt import get_current_user
from backend.app.utils.file_parser import parse_file
from backend.app.ai.gemini_client import parse_resume_with_gemini
from backend.app.services.ats_engine import analyze_resume_ats
from backend.app.ai.vector_store import vector_store

router = APIRouter(prefix="/resumes", tags=["Resumes"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify file extension
    filename = file.filename
    ext = filename.split(".")[-1].lower()
    if ext not in ["pdf", "docx"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Only PDF and DOCX files are allowed."
        )

    # Read file bytes
    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read uploaded file: {str(e)}")

    # Parse file contents (extract text)
    parsed_text = parse_file(filename, file_bytes)
    if not parsed_text.strip():
        raise HTTPException(status_code=400, detail="The uploaded file appears to be empty or unparseable.")

    # Save file locally (acting as local mock storage instead of S3 for offline setup)
    file_path = os.path.join(UPLOAD_DIR, f"user_{current_user.id}_{int(os.getpid())}_{filename}")
    try:
        with open(file_path, "wb") as f:
            f.write(file_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Execute parser engine (LLM info extraction)
    parsed_json = parse_resume_with_gemini(parsed_text)

    # Run ATS analysis to calculate score and detailed breakdown
    ats_analysis = analyze_resume_ats(parsed_text, parsed_json)
    overall_score = ats_analysis["overall_score"]

    # Create Resume DB record
    db_resume = Resume(
        user_id=current_user.id,
        filename=filename,
        file_url=file_path,
        parsed_text=parsed_text,
        parsed_json=parsed_json,
        ats_score=overall_score
    )
    db.add(db_resume)
    db.commit()
    db.refresh(db_resume)

    # Create and save detailed ATS report
    db_report = ATSReport(
        resume_id=db_resume.id,
        formatting_score=ats_analysis["sub_scores"]["formatting"],
        readability_score=ats_analysis["sub_scores"]["readability"],
        skills_score=ats_analysis["sub_scores"]["skills"],
        verbs_score=ats_analysis["sub_scores"]["verbs"],
        keyword_match_rate=ats_analysis["sub_scores"]["quantification"], # repurpose to quantification in backend db report
        improvement_areas=ats_analysis["improvement_areas"],
        detailed_suggestions=ats_analysis["detailed_suggestions"]
    )
    db.add(db_report)

    # Save initial Resume Version
    db_version = ResumeVersion(
        resume_id=db_resume.id,
        version_num=1,
        filename=filename,
        file_url=file_path,
        parsed_text=parsed_text,
        parsed_json=parsed_json,
        ats_score=overall_score
    )
    db.add(db_version)
    db.commit()

    # Index in vector database
    try:
        vector_store.add_resume(db_resume.id, current_user.id, parsed_json, parsed_text)
    except Exception as vs_err:
        print(f"Failed to index resume in vector store: {vs_err}")

    return db_resume

@router.get("", response_model=List[ResumeListResponse])
def list_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.created_at.desc()).all()
    return resumes

@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume

@router.get("/{resume_id}/report", response_model=ATSReportResponse)
def get_resume_report(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    report = db.query(ATSReport).filter(ATSReport.resume_id == resume_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="ATS Report not found for this resume")
    return report

@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Delete local file if it exists
    if resume.file_url and os.path.exists(resume.file_url):
        try:
            os.remove(resume.file_url)
        except Exception as e:
            print(f"Error removing local file: {e}")

    # Delete from vector store
    try:
        vector_store.delete_resume(resume_id)
    except Exception as vs_err:
        print(f"Error deleting from vector store: {vs_err}")

    db.delete(resume)
    db.commit()
    return None


@router.get("/{resume_id}/export", tags=["Resumes"])
def export_resume_report(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate and return a downloadable HTML ATS analysis report for the given resume."""
    from fastapi.responses import Response

    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    report = db.query(ATSReport).filter(ATSReport.resume_id == resume_id).first()
    pj = resume.parsed_json or {}
    name = pj.get("name", "Candidate")
    email = pj.get("email", "N/A")
    skills = pj.get("skills", [])
    created = resume.created_at.strftime("%B %d, %Y at %H:%M UTC") if resume.created_at else "N/A"

    skills_html = "".join([
        f'<span style="display:inline-block;margin:3px;padding:4px 12px;background:#a855f710;border:1px solid #a855f740;border-radius:9999px;color:#c084fc;font-size:12px;">{s}</span>'
        for s in skills
    ])

    sub_rows = ""
    if report:
        sub_scores = [
            ("Formatting Quality", report.formatting_score),
            ("Readability Score", report.readability_score),
            ("Skills Relevance", report.skills_score),
            ("Action Verb Usage", report.verbs_score),
            ("Quantification Rate", report.keyword_match_rate),
        ]
        for label, score in sub_scores:
            bar_color = "#10b981" if score >= 80 else "#f59e0b" if score >= 60 else "#ef4444"
            sub_rows += f"""
            <tr>
              <td style="padding:10px 16px;color:#9ca3af;font-size:13px;">{label}</td>
              <td style="padding:10px 16px;">
                <div style="background:#ffffff10;border-radius:4px;overflow:hidden;height:8px;width:200px;">
                  <div style="height:100%;width:{score}%;background:{bar_color};border-radius:4px;"></div>
                </div>
              </td>
              <td style="padding:10px 16px;color:#ffffff;font-size:13px;font-weight:700;">{round(score)}%</td>
            </tr>"""

    suggestions_html = ""
    if report and report.detailed_suggestions:
        for s in report.detailed_suggestions:
            suggestions_html += f"""
            <div style="margin-bottom:12px;padding:12px 16px;background:#ffffff05;border:1px solid #ffffff10;border-radius:10px;">
              <div style="font-size:11px;color:#a855f7;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">{s.get('category','')}</div>
              <div style="font-size:13px;color:#d1d5db;">{s.get('message','')}</div>
            </div>"""

    score_color = "#10b981" if resume.ats_score >= 80 else "#f59e0b" if resume.ats_score >= 60 else "#ef4444"

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Apex ATS Report - {name}</title>
<style>
* {{ margin:0;padding:0;box-sizing:border-box; }}
body {{ background:#030303;color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }}
.container {{ max-width:860px;margin:0 auto;padding:40px 24px; }}
.header {{ text-align:center;padding:48px 24px;background:linear-gradient(135deg,#a855f715 0%,#06b6d415 100%);border:1px solid #ffffff10;border-radius:20px;margin-bottom:32px; }}
.logo {{ font-size:14px;font-weight:700;letter-spacing:4px;color:#06b6d4;margin-bottom:16px; }}
.name {{ font-size:32px;font-weight:900;color:#ffffff; }}
.meta {{ color:#9ca3af;font-size:14px;margin-top:8px; }}
.section {{ background:#0a0914;border:1px solid #ffffff0d;border-radius:16px;padding:24px;margin-bottom:20px; }}
.section-title {{ font-size:14px;font-weight:700;color:#ffffff;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;padding-bottom:8px;border-bottom:1px solid #ffffff0d; }}
table {{ width:100%;border-collapse:collapse; }}
@media print {{ body {{ -webkit-print-color-adjust:exact; }} }}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="logo">APEX CAREER OS</div>
    <div class="name">{name}</div>
    <div class="meta">{email} &middot; {resume.filename}</div>
    <div class="meta" style="margin-top:4px;font-size:12px;">Generated: {created}</div>
    <div style="margin:24px auto;display:inline-block;padding:16px 32px;background:{score_color}20;border:2px solid {score_color}60;border-radius:16px;">
      <div style="font-size:48px;font-weight:900;color:{score_color};">{round(resume.ats_score)}%</div>
      <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:2px;">ATS Score</div>
    </div>
  </div>

  {'<div class="section"><div class="section-title">ATS Score Breakdown</div><table>' + sub_rows + '</table></div>' if report else ''}

  {'<div class="section"><div class="section-title">Extracted Skills</div><div>' + skills_html + '</div></div>' if skills else ''}

  {'<div class="section"><div class="section-title">Improvement Recommendations</div>' + suggestions_html + '</div>' if suggestions_html else ''}

  <div style="text-align:center;padding:32px;color:#4b5563;font-size:12px;">
    Generated by Apex Career OS &middot; Powered by Google Gemini AI
  </div>
</div>
</body>
</html>"""

    return Response(
        content=html_content,
        media_type="text/html",
        headers={"Content-Disposition": f'attachment; filename="apex-ats-report-{resume_id}.html"'}
    )


@router.get("/{resume_id}/versions", tags=["Resumes"])
def get_resume_versions(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return all saved version snapshots of a given resume."""
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    versions = (
        db.query(ResumeVersion)
        .filter(ResumeVersion.resume_id == resume_id)
        .order_by(ResumeVersion.version_num.desc())
        .all()
    )

    return [
        {
            "id": v.id,
            "version_num": v.version_num,
            "filename": v.filename,
            "ats_score": v.ats_score,
            "created_at": v.created_at.isoformat() if v.created_at else None,
            "skill_count": len(v.parsed_json.get("skills", [])) if v.parsed_json else 0,
        }
        for v in versions
    ]
