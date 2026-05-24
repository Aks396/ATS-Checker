from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.db.session import Base

class MockInterview(Base):
    __tablename__ = "mock_interviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    job_title = Column(String(255), nullable=True)
    job_description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User")
    resume = relationship("Resume")
    turns = relationship("MockInterviewTurn", back_populates="interview", cascade="all, delete-orphan")


class MockInterviewTurn(Base):
    __tablename__ = "mock_interview_turns"

    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("mock_interviews.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), nullable=False)  # 'interviewer' or 'candidate'
    content = Column(Text, nullable=False)
    feedback = Column(JSON, nullable=True)  # STAR feedback breakdown and scoring
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    interview = relationship("MockInterview", back_populates="turns")
