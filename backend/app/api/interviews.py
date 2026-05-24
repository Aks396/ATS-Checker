import os
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import google.generativeai as genai

from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.models.resume import Resume
from backend.app.models.interview import MockInterview, MockInterviewTurn
from backend.app.schemas.interview import (
    MockInterviewStartRequest,
    MockInterviewResponse,
    MockInterviewTurnRequest,
    MockInterviewTurnResponse
)
from backend.app.auth.jwt import get_current_user
from backend.app.ai.gemini_client import get_gemini_model, HAS_API_KEY

router = APIRouter(prefix="/interviews", tags=["Interviews"])

@router.post("/start", response_model=MockInterviewResponse)
def start_interview(
    payload: MockInterviewStartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a new mock interview session and return the first question."""
    # Verify resume belongs to user
    resume = db.query(Resume).filter(Resume.id == payload.resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    job_title = payload.job_title or "Software Engineer"
    job_description = payload.job_description or "General tech role requiring problem solving, collaboration, and coding skills."

    # Create interview session record
    db_interview = MockInterview(
        user_id=current_user.id,
        resume_id=payload.resume_id,
        job_title=job_title,
        job_description=job_description
    )
    db.add(db_interview)
    db.commit()
    db.refresh(db_interview)

    # Generate first question
    first_question = ""
    if HAS_API_KEY:
        try:
            model = get_gemini_model("gemini-1.5-flash", response_mime_type=None)
            prompt = f"""
            You are Apex Interviewer, an elite technical recruiter and HR coordinator.
            You are conducting a professional mock interview for a candidate.
            
            Candidate's Resume Text:
            ==================================
            {resume.parsed_text}
            ==================================

            Target Job Position: {job_title}
            Target Job Description:
            ==================================
            {job_description}
            ==================================

            Please ask the first interview question. It can be a behavioral question (such as "Tell me about a time when...") or a technical question directly relevant to their resume.
            Write ONLY the question. Keep it concise, engaging, and professional. Do NOT include greetings, preamble, or formatting.
            """
            response = model.generate_content(prompt)
            first_question = response.text.strip()
        except Exception as e:
            print(f"Error calling Gemini for interview start: {e}")
            first_question = ""

    if not first_question:
        # Fallback question
        first_question = f"Thanks for taking the time to interview for the {job_title} role. Let's start with your experience: can you describe a challenging project you worked on, detailing the technologies you chose and the specific problem you solved?"

    # Save turn to database
    db_turn = MockInterviewTurn(
        interview_id=db_interview.id,
        role="interviewer",
        content=first_question
    )
    db.add(db_turn)
    db.commit()

    db.refresh(db_interview)
    return db_interview


@router.post("/{id}/respond", response_model=List[MockInterviewTurnResponse])
def respond_interview(
    id: int,
    payload: MockInterviewTurnRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Receive the candidate's response, score it using the STAR methodology, and generate the next question."""
    interview = db.query(MockInterview).filter(MockInterview.id == id, MockInterview.user_id == current_user.id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview session not found")

    user_answer = payload.content.strip()
    if not user_answer:
        raise HTTPException(status_code=400, detail="Answer content cannot be empty")

    # Retrieve previous turns to maintain history
    turns = db.query(MockInterviewTurn).filter(MockInterviewTurn.interview_id == id).order_by(MockInterviewTurn.created_at.asc()).all()
    if not turns:
        raise HTTPException(status_code=400, detail="Interview state corrupted (no initial question)")

    # 1. Save candidate response turn
    db_candidate_turn = MockInterviewTurn(
        interview_id=id,
        role="candidate",
        content=user_answer
    )
    db.add(db_candidate_turn)
    db.commit()
    db.refresh(db_candidate_turn)

    # Re-retrieve all turns including candidate response
    turns.append(db_candidate_turn)

    # 2. Evaluate answer and generate next question
    feedback = None
    next_question = ""

    if HAS_API_KEY:
        try:
            model = get_gemini_model("gemini-1.5-flash")
            
            # Format history
            history_str = ""
            for t in turns[:-1]: # exclude the latest candidate response to pass separately
                role_label = "Interviewer" if t.role == "interviewer" else "Candidate"
                history_str += f"{role_label}: {t.content}\n"

            prompt = f"""
            You are Apex Interviewer, conducting a professional mock interview.
            Review the candidate's resume, the target job description, the conversation history, and the Candidate's latest response.
            
            Candidate's Resume:
            {interview.resume.parsed_text}
            
            Job Position: {interview.job_title}
            Job Description: {interview.job_description}
            
            CONVERSATION HISTORY:
            ==================================
            {history_str}
            ==================================
            
            INTERVIEWER'S LAST QUESTION:
            {turns[-2].content}
            
            CANDIDATE'S LATEST RESPONSE:
            {user_answer}
            
            Evaluate the Candidate's response specifically on the STAR (Situation, Task, Action, Result) methodology:
            - Situation: Did they specify the context?
            - Task: Did they state the goals/challenge?
            - Action: Did they describe their specific contributions and technology choices?
            - Result: Did they quantify the outcome?
            
            Provide a score from 0 to 100, suggestions for improvement, and a polished 'Model Answer' incorporating details from their resume.
            Then, formulate the next logical interview question.
            
            You MUST return a structured JSON response in this exact format:
            {{
                "feedback": {{
                    "score": 85,
                    "star_breakdown": {{
                        "situation": "Situation analysis...",
                        "task": "Task analysis...",
                        "action": "Action analysis...",
                        "result": "Result/Quantification analysis..."
                    }},
                    "suggestions": "Suggestions on how to improve this specific answer...",
                    "model_answer": "A model STAR answer written for this candidate using their resume..."
                }},
                "next_question": "Your next follow-up question..."
            }}
            """
            response = model.generate_content(prompt)
            data = json.loads(response.text.strip())
            feedback = data.get("feedback")
            next_question = data.get("next_question", "")
        except Exception as e:
            print(f"Error calling Gemini for interview response: {e}")
            feedback = None

    if not feedback:
        # Offline/error fallback evaluation
        # Generate generic feedback based on length and action verbs
        score = 65
        words = len(user_answer.split())
        if words > 50:
            score += 15
        if "%" in user_answer or "percent" in user_answer or any(c.isdigit() for c in user_answer):
            score += 10
        score = min(score, 95)
        
        feedback = {
            "score": score,
            "star_breakdown": {
                "situation": "Good baseline setting of the project context." if words > 30 else "Lacking background context. State where this project occurred.",
                "task": "The problem parameters are described." if words > 50 else "Ensure you outline the specific technical goals of the task.",
                "action": "Actions are listed, but could be clearer on your specific individual contributions." if words < 70 else "Strong detail of individual technical choices.",
                "result": "Quantifiable result mentioned." if "%" in user_answer else "Lacking metric-driven outcomes. Always mention percentages, load drops, or dollar figures saved."
            },
            "suggestions": "Try structuring your responses using the STAR format directly: state the problem, the technical goal, your exact code/design actions, and then the metric outcomes.",
            "model_answer": f"At my previous position, I addressed a similar bottleneck. I refactored our API routes using FastAPI, resulting in a 25% throughput increase and cutting database overhead."
        }
        next_question = "Excellent. Let's move on: can you tell me about a time when you had to deal with conflict or misalignment on a technical project, and how you resolved it?"

    # Update candidate turn with feedback in database
    db_candidate_turn.feedback = feedback
    db.commit()

    # Save next question as new interviewer turn
    db_next_turn = MockInterviewTurn(
        interview_id=id,
        role="interviewer",
        content=next_question
    )
    db.add(db_next_turn)
    db.commit()
    db.refresh(db_next_turn)

    return [db_candidate_turn, db_next_turn]

@router.get("/{id}/report")
def get_interview_report(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return a composite score and summary feedback of the entire mock interview session."""
    interview = db.query(MockInterview).filter(MockInterview.id == id, MockInterview.user_id == current_user.id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview session not found")

    candidate_turns = (
        db.query(MockInterviewTurn)
        .filter(MockInterviewTurn.interview_id == id, MockInterviewTurn.role == "candidate")
        .all()
    )
    if not candidate_turns:
        return {
            "id": id,
            "job_title": interview.job_title,
            "average_score": 0.0,
            "evaluations_count": 0,
            "suggestions_summary": "No answers evaluated yet."
        }

    scores = []
    suggestions = []
    for turn in candidate_turns:
        if turn.feedback and "score" in turn.feedback:
            scores.append(turn.feedback["score"])
        if turn.feedback and "suggestions" in turn.feedback:
            suggestions.append(turn.feedback["suggestions"])

    avg_score = sum(scores) / len(scores) if scores else 70.0
    
    return {
        "id": id,
        "job_title": interview.job_title,
        "average_score": round(avg_score, 1),
        "evaluations_count": len(scores),
        "suggestions_summary": "\n".join([f"- {s}" for s in suggestions[:4]])
    }
