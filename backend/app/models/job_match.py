from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.db.session import Base

class JobMatch(Base):
    __tablename__ = "job_matches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    job_title = Column(String(255), nullable=True)
    job_description = Column(Text, nullable=False)
    match_score = Column(Float, default=0.0)
    missing_skills = Column(JSON, nullable=True)   # Array of strings
    keyword_gaps = Column(JSON, nullable=True)     # Array of strings
    suggestions = Column(JSON, nullable=True)      # Object or array of tips
    job_application_id = Column(Integer, ForeignKey("job_applications.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="job_matches")
    resume = relationship("Resume", back_populates="matches")
    job_application = relationship("JobApplication", back_populates="job_matches")
