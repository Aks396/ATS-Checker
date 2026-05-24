import os
import sys

# Workaround for passlib + bcrypt 4.x compatibility issue before passlib gets imported
try:
    import bcrypt
    if not hasattr(bcrypt, "__about__"):
        bcrypt.__about__ = type("About", (object,), {"__version__": bcrypt.__version__})
except ImportError:
    pass

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Append the parent directory of backend to the path so we can import 'backend'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import database and models to initialize schema
from backend.app.db.session import engine, Base
import backend.app.models as models

# Import routers
from backend.app.api.auth import router as auth_router
from backend.app.api.resumes import router as resumes_router
from backend.app.api.matches import router as matches_router
from backend.app.api.analytics import router as analytics_router
from backend.app.api.chat import router as chat_router
from backend.app.api.applications import router as applications_router
from backend.app.api.interviews import router as interviews_router
from backend.app.api.editor import router as editor_router
from backend.app.api.recruiter import router as recruiter_router
from backend.app.api.profile import router as profile_router
from backend.app.api.jobs import router as jobs_router

# Load env variables
load_dotenv()

# Auto-create tables (SQLite/MySQL) on startup
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized successfully.")
except Exception as e:
    print(f"Error initializing database tables: {e}")

app = FastAPI(
    title="Resume ATS Analyzer SaaS API",
    description="Backend API for parsing, scoring, and matching resumes utilizing Gemini AI.",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(auth_router, prefix="/api")
app.include_router(resumes_router, prefix="/api")
app.include_router(matches_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(applications_router, prefix="/api")
app.include_router(interviews_router, prefix="/api")
app.include_router(editor_router, prefix="/api")
app.include_router(recruiter_router, prefix="/api")
app.include_router(profile_router, prefix="/api")
app.include_router(jobs_router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Resume ATS Analyzer SaaS API",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
