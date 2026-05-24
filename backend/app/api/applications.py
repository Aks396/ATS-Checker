from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.models.application import JobApplication, ApplicationTask
from backend.app.models.job_match import JobMatch
from backend.app.models.resume import Resume
from backend.app.ai.gemini_client import match_job_with_gemini
from backend.app.schemas.application import (
    JobApplicationCreate,
    JobApplicationUpdate,
    JobApplicationResponse,
    ApplicationTaskCreate,
    ApplicationTaskResponse
)
from backend.app.auth.jwt import get_current_user

router = APIRouter(prefix="/applications", tags=["Applications"])

@router.get("", response_model=List[JobApplicationResponse])
def list_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all job application cards for the active user."""
    applications = (
        db.query(JobApplication)
        .filter(JobApplication.user_id == current_user.id)
        .order_by(JobApplication.created_at.desc())
        .all()
    )
    
    # Map match score if a linked job match exists
    response_data = []
    for app in applications:
        # Find match score
        match_score = 0.0
        if app.resume_id and app.job_description:
            match = (
                db.query(JobMatch)
                .filter(
                    JobMatch.user_id == current_user.id,
                    JobMatch.resume_id == app.resume_id,
                    JobMatch.job_application_id == app.id
                )
                .first()
            )
            if not match:
                # Fallback to general matches for this resume & description
                match = (
                    db.query(JobMatch)
                    .filter(
                        JobMatch.user_id == current_user.id,
                        JobMatch.resume_id == app.resume_id,
                        JobMatch.job_description == app.job_description
                    )
                    .first()
                )
            if match:
                match_score = match.match_score
                
        # Build response item
        app_dict = {
            "id": app.id,
            "user_id": app.user_id,
            "resume_id": app.resume_id,
            "company": app.company,
            "title": app.title,
            "status": app.status,
            "job_description": app.job_description,
            "salary": app.salary,
            "location": app.location,
            "url": app.url,
            "created_at": app.created_at,
            "updated_at": app.updated_at,
            "tasks": app.tasks,
            "match_score": match_score
        }
        response_data.append(app_dict)
        
    return response_data

@router.post("", response_model=JobApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(
    payload: JobApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new job application card."""
    db_app = JobApplication(
        user_id=current_user.id,
        resume_id=payload.resume_id,
        company=payload.company,
        title=payload.title,
        status=payload.status or "wishlist",
        job_description=payload.job_description,
        salary=payload.salary,
        location=payload.location,
        url=payload.url
    )
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    
    # Auto-calculate match if possible
    match_score = 0.0
    if db_app.resume_id and db_app.job_description:
        resume = db.query(Resume).filter(Resume.id == db_app.resume_id, Resume.user_id == current_user.id).first()
        if resume:
            try:
                match_data = match_job_with_gemini(resume.parsed_text, db_app.job_description)
                match = JobMatch(
                    user_id=current_user.id,
                    resume_id=db_app.resume_id,
                    job_title=db_app.title,
                    job_description=db_app.job_description,
                    match_score=match_data.get("match_score", 0.0),
                    missing_skills=match_data.get("missing_skills", []),
                    keyword_gaps=match_data.get("keyword_gaps", []),
                    suggestions=match_data.get("suggestions", []),
                    job_application_id=db_app.id
                )
                db.add(match)
                db.commit()
                db.refresh(match)
                match_score = match.match_score
            except Exception as e:
                print(f"Error auto-calculating match on creation: {e}")
                
    # Build response item
    app_dict = {
        "id": db_app.id,
        "user_id": db_app.user_id,
        "resume_id": db_app.resume_id,
        "company": db_app.company,
        "title": db_app.title,
        "status": db_app.status,
        "job_description": db_app.job_description,
        "salary": db_app.salary,
        "location": db_app.location,
        "url": db_app.url,
        "created_at": db_app.created_at,
        "updated_at": db_app.updated_at,
        "tasks": db_app.tasks,
        "match_score": match_score
    }
    return app_dict

@router.get("/{id}", response_model=JobApplicationResponse)
def get_application(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detail of a specific job application card."""
    app = db.query(JobApplication).filter(JobApplication.id == id, JobApplication.user_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Job application not found")
        
    # Get match score
    match_score = 0.0
    if app.resume_id and app.job_description:
        match = (
            db.query(JobMatch)
            .filter(
                JobMatch.user_id == current_user.id,
                JobMatch.resume_id == app.resume_id,
                JobMatch.job_application_id == app.id
            )
            .first()
        )
        if match:
            match_score = match.match_score
            
    app_dict = {
        "id": app.id,
        "user_id": app.user_id,
        "resume_id": app.resume_id,
        "company": app.company,
        "title": app.title,
        "status": app.status,
        "job_description": app.job_description,
        "salary": app.salary,
        "location": app.location,
        "url": app.url,
        "created_at": app.created_at,
        "updated_at": app.updated_at,
        "tasks": app.tasks,
        "match_score": match_score
    }
    return app_dict

@router.put("/{id}", response_model=JobApplicationResponse)
def update_application(
    id: int,
    payload: JobApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a job application card. Handles moving columns (changing status) and details."""
    app = db.query(JobApplication).filter(JobApplication.id == id, JobApplication.user_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Job application not found")

    old_resume_id = app.resume_id
    old_job_description = app.job_description

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(app, key, value)

    db.commit()
    db.refresh(app)

    # Resolve match score
    match_score = 0.0
    if app.resume_id and app.job_description:
        # Check if match exists
        match = (
            db.query(JobMatch)
            .filter(
                JobMatch.user_id == current_user.id,
                JobMatch.job_application_id == app.id
            )
            .first()
        )
        if not match:
            # Fallback search by resume and description
            match = (
                db.query(JobMatch)
                .filter(
                    JobMatch.user_id == current_user.id,
                    JobMatch.resume_id == app.resume_id,
                    JobMatch.job_description == app.job_description
                )
                .first()
            )

        # Check if we need to recalculate
        needs_calculation = (
            not match or
            app.resume_id != old_resume_id or
            app.job_description != old_job_description
        )

        if needs_calculation:
            resume = db.query(Resume).filter(Resume.id == app.resume_id, Resume.user_id == current_user.id).first()
            if resume:
                try:
                    match_data = match_job_with_gemini(resume.parsed_text, app.job_description)
                    if match:
                        match.resume_id = app.resume_id
                        match.job_title = app.title
                        match.job_description = app.job_description
                        match.match_score = match_data.get("match_score", 0.0)
                        match.missing_skills = match_data.get("missing_skills", [])
                        match.keyword_gaps = match_data.get("keyword_gaps", [])
                        match.suggestions = match_data.get("suggestions", [])
                        match.job_application_id = app.id
                    else:
                        match = JobMatch(
                            user_id=current_user.id,
                            resume_id=app.resume_id,
                            job_title=app.title,
                            job_description=app.job_description,
                            match_score=match_data.get("match_score", 0.0),
                            missing_skills=match_data.get("missing_skills", []),
                            keyword_gaps=match_data.get("keyword_gaps", []),
                            suggestions=match_data.get("suggestions", []),
                            job_application_id=app.id
                        )
                        db.add(match)
                    db.commit()
                    db.refresh(match)
                    match_score = match.match_score
                except Exception as e:
                    print(f"Error auto-calculating match on update: {e}")
                    if match:
                        match_score = match.match_score
        else:
            if match:
                # Ensure the existing match has correct job_application_id linked
                if match.job_application_id != app.id:
                    match.job_application_id = app.id
                    db.commit()
                match_score = match.match_score
    
    app_dict = {
        "id": app.id,
        "user_id": app.user_id,
        "resume_id": app.resume_id,
        "company": app.company,
        "title": app.title,
        "status": app.status,
        "job_description": app.job_description,
        "salary": app.salary,
        "location": app.location,
        "url": app.url,
        "created_at": app.created_at,
        "updated_at": app.updated_at,
        "tasks": app.tasks,
        "match_score": match_score
    }
    return app_dict

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a job application card."""
    app = db.query(JobApplication).filter(JobApplication.id == id, JobApplication.user_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Job application not found")

    db.delete(app)
    db.commit()
    return None

# Task checklist management endpoints
@router.post("/{id}/tasks", response_model=ApplicationTaskResponse, status_code=status.HTTP_201_CREATED)
def create_application_task(
    id: int,
    payload: ApplicationTaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a checklist item to a job application."""
    app = db.query(JobApplication).filter(JobApplication.id == id, JobApplication.user_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Job application not found")

    db_task = ApplicationTask(
        application_id=id,
        title=payload.title,
        due_date=payload.due_date
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@router.put("/tasks/{task_id}", response_model=ApplicationTaskResponse)
def toggle_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle completion status of a checklist task."""
    task = (
        db.query(ApplicationTask)
        .join(JobApplication)
        .filter(ApplicationTask.id == task_id, JobApplication.user_id == current_user.id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.is_completed = not task.is_completed
    db.commit()
    db.refresh(task)
    return task

@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a checklist task."""
    task = (
        db.query(ApplicationTask)
        .join(JobApplication)
        .filter(ApplicationTask.id == task_id, JobApplication.user_id == current_user.id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return None
