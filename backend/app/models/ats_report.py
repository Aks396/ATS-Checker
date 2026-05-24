from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.db.session import Base

class ATSReport(Base):
    __tablename__ = "ats_reports"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    formatting_score = Column(Float, default=0.0)
    readability_score = Column(Float, default=0.0)
    skills_score = Column(Float, default=0.0)
    verbs_score = Column(Float, default=0.0)
    keyword_match_rate = Column(Float, default=0.0)
    improvement_areas = Column(JSON, nullable=True)     # List of structural areas to improve
    detailed_suggestions = Column(JSON, nullable=True)  # Detailed list of text items to change
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    resume = relationship("Resume", back_populates="reports")
