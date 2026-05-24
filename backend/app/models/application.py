from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.db.session import Base

class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)
    company = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False)
    status = Column(String(50), default="wishlist")  # 'wishlist', 'applied', 'interviewing', 'offer', 'rejected'
    job_description = Column(Text, nullable=True)
    salary = Column(String(100), nullable=True)
    location = Column(String(255), nullable=True)
    url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User")
    resume = relationship("Resume")
    tasks = relationship("ApplicationTask", back_populates="application", cascade="all, delete-orphan")
    job_matches = relationship("JobMatch", back_populates="job_application")


class ApplicationTask(Base):
    __tablename__ = "application_tasks"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("job_applications.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    is_completed = Column(Boolean, default=False)
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    application = relationship("JobApplication", back_populates="tasks")
