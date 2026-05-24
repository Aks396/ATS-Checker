from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.db.session import Base

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_url = Column(String(500), nullable=True) # S3 or local storage URL
    parsed_text = Column(Text, nullable=True)     # Raw text of resume
    parsed_json = Column(JSON, nullable=True)     # Structured JSON (skills, experience, etc.)
    ats_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="resumes")
    versions = relationship("ResumeVersion", back_populates="resume", cascade="all, delete-orphan")
    reports = relationship("ATSReport", back_populates="resume", cascade="all, delete-orphan")
    matches = relationship("JobMatch", back_populates="resume", cascade="all, delete-orphan")


class ResumeVersion(Base):
    __tablename__ = "resume_versions"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    version_num = Column(Integer, nullable=False)
    filename = Column(String(255), nullable=False)
    file_url = Column(String(500), nullable=True)
    parsed_text = Column(Text, nullable=True)
    parsed_json = Column(JSON, nullable=True)
    ats_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    resume = relationship("Resume", back_populates="versions")
