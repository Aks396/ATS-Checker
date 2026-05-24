import os
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import google.generativeai as genai

from backend.app.db.session import get_db, SessionLocal
from backend.app.models.user import User
from backend.app.models.resume import Resume
from backend.app.models.chat import ChatMessage
from backend.app.schemas.chat import ChatMessageResponse, ChatMessageCreate
from backend.app.auth.jwt import get_current_user
from backend.app.ai.vector_store import vector_store
from backend.app.ai.gemini_client import get_gemini_model

router = APIRouter(prefix="/chat", tags=["Chat"])

# Configure the Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
HAS_API_KEY = len(GEMINI_API_KEY.strip()) > 0
if HAS_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


@router.get("/{resume_id}/history", response_model=List[ChatMessageResponse])
def get_chat_history(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves chat history for a specific resume and user."""
    # Verify resume belongs to user
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.resume_id == resume_id, ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return messages


@router.post("/{resume_id}/message")
async def send_chat_message(
    resume_id: int,
    payload: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Streams RAG chat responses for a resume using Gemini."""
    # Verify resume belongs to user
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    user_query = payload.content.strip()
    if not user_query:
        raise HTTPException(status_code=400, detail="Message content cannot be empty")

    # 1. Query vector database for relevant resume context
    try:
        context_chunks = vector_store.query_resume(resume_id, user_query, n_results=4)
        context_text = "\n---\n".join(context_chunks)
    except Exception as vs_err:
        print(f"Error querying vector store in chat: {vs_err}")
        context_text = "No resume context found."

    # 2. Retrieve recent chat history for context (last 8 messages)
    history_messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.resume_id == resume_id, ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.desc())
        .limit(8)
        .all()
    )
    # Reverse to restore chronological order
    history_messages.reverse()

    # 3. Construct conversation history string
    history_str = ""
    for msg in history_messages:
        role_label = "User" if msg.role == "user" else "Copilot"
        history_str += f"{role_label}: {msg.content}\n"

    # 4. Formulate the system instruction prompt
    system_instruction = (
        "You are Apex Copilot, an elite AI Career Advisor and Technical Recruiter.\n"
        "Your goal is to help the candidate optimize their resume, explain sections, rewrite achievements,\n"
        "and suggest additions/changes based ONLY on the provided resume context.\n"
        "Be professional, encouraging, and provide concrete, actionable rewrites. Structure your response using markdown.\n"
        "Use bullet points, bold tags, and code blocks for readability where appropriate.\n"
    )

    full_prompt = f"""{system_instruction}

RESUME CONTEXT CHUNKS:
==================================
{context_text}
==================================

CONVERSATION HISTORY:
==================================
{history_str}
==================================

NEW USER INQUIRY:
{user_query}

APEX COPILOT RESPONSE:"""

    # If Gemini API Key is missing, stream a mock response
    if not HAS_API_KEY:
        async def mock_event_generator():
            mock_text = (
                f"### [DEMO MODE - Offline Fallback]\n\n"
                f"Hello! I parsed your inquiry: **\"{user_query}\"**.\n\n"
                f"Because no `GEMINI_API_KEY` was supplied, I am running in local offline demo mode. "
                f"Normally, I would query our Vector database (which has parsed your resume) and use Gemini 1.5 Flash to stream answers.\n\n"
                f"Here are some helpful suggestions based on the context chunks retrieved from your resume:\n"
                f"1. **Strengthen Bullet Points:** Ensure you quantify impact (e.g., using % or revenue figures).\n"
                f"2. **Add Missing Skills:** Review job descriptions in the 'Job Matching' tab to identify keywords to add.\n\n"
                f"Please add a `GEMINI_API_KEY` to the `.env` file to unlock the full AI RAG chat features!"
            )
            
            # Stream word by word
            words = mock_text.split(" ")
            full_response = ""
            import asyncio
            for w in words:
                word_chunk = w + " "
                full_response += word_chunk
                yield f"data: {json.dumps({'text': word_chunk})}\n\n"
                await asyncio.sleep(0.04)

            # Save to database
            db_session = SessionLocal()
            try:
                user_msg = ChatMessage(
                    user_id=current_user.id,
                    resume_id=resume_id,
                    role="user",
                    content=user_query
                )
                db_session.add(user_msg)
                
                assistant_msg = ChatMessage(
                    user_id=current_user.id,
                    resume_id=resume_id,
                    role="assistant",
                    content=full_response
                )
                db_session.add(assistant_msg)
                db_session.commit()
            except Exception as e:
                print(f"Error saving mock chat: {e}")
            finally:
                db_session.close()

        return StreamingResponse(mock_event_generator(), media_type="text/event-stream")

    # Stream from Gemini API
    def event_generator():
        full_response = ""
        try:
            model = get_gemini_model("gemini-2.5-flash", response_mime_type=None)
            response = model.generate_content(full_prompt, stream=True)
            for chunk in response:
                text = chunk.text
                full_response += text
                yield f"data: {json.dumps({'text': text})}\n\n"
        except Exception as stream_err:
            print(f"Gemini streaming error: {stream_err}")
            yield f"data: {json.dumps({'error': str(stream_err)})}\n\n"
        finally:
            # Save messages in database after stream closes
            db_session = SessionLocal()
            try:
                user_msg = ChatMessage(
                    user_id=current_user.id,
                    resume_id=resume_id,
                    role="user",
                    content=user_query
                )
                db_session.add(user_msg)
                
                assistant_msg = ChatMessage(
                    user_id=current_user.id,
                    resume_id=resume_id,
                    role="assistant",
                    content=full_response if full_response else "I encountered an error generating a response."
                )
                db_session.add(assistant_msg)
                db_session.commit()
            except Exception as save_err:
                print(f"Error saving chat log to database: {save_err}")
            finally:
                db_session.close()

    return StreamingResponse(event_generator(), media_type="text/event-stream")
