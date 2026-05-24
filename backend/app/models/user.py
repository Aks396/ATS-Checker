from sqlalchemy import Column, Integer, String, DateTime, Float, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.db.session import Base

class User(Base):
    __tablename__ = "users"

    # ── Core Auth Fields ──────────────────────────────────────────────
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    profile_image = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # ── Profile Identity Fields ───────────────────────────────────────
    bio = Column(Text, nullable=True)
    career_title = Column(String(150), nullable=True)   # e.g. "Senior Full Stack Engineer"
    target_role = Column(String(150), nullable=True)    # e.g. "Staff Engineer"
    banner_color = Column(String(100), nullable=True, default="from-purple-600 via-blue-600 to-cyan-500")

    # ── Career Preferences ────────────────────────────────────────────
    preferred_stack = Column(JSON, nullable=True)       # ["React", "FastAPI", "AWS"]
    target_salary = Column(String(50), nullable=True)   # "$120k - $150k"
    experience_level = Column(String(50), nullable=True, default="mid")   # junior/mid/senior/lead
    remote_preference = Column(String(50), nullable=True, default="remote")  # remote/hybrid/onsite

    # ── Social Links ──────────────────────────────────────────────────
    linkedin_url = Column(String(300), nullable=True)
    github_url = Column(String(300), nullable=True)
    portfolio_url = Column(String(300), nullable=True)

    # ── AI-Computed Scores (updated by profile insights endpoint) ─────
    ai_career_score = Column(Float, default=0.0)
    recruiter_visibility_score = Column(Float, default=0.0)

    # ── Gamification ─────────────────────────────────────────────────
    xp_points = Column(Integer, default=0)
    career_level = Column(String(50), nullable=True, default="Rookie")

    # ── Relationships ─────────────────────────────────────────────────
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    job_matches = relationship("JobMatch", back_populates="user", cascade="all, delete-orphan")
