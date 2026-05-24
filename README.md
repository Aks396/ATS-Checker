# 🚀 APEX ATS // Next-Gen AI Resume Intelligence & Career Telemetry Platform

APEX ATS is an enterprise-grade, production-ready AI-powered Applicant Tracking System (ATS) optimization SaaS platform. It leverages **Google Gemini Large Language Models (LLMs)**, **Vector Embeddings**, and **Natural Language Processing (NLP)** to analyze resumes, score them against industry standards, and offer interactive optimizations.

---

## 🌌 Core AI Features & Architecture

APEX ATS is built around a comprehensive suite of AI engines designed to elevate a candidate's profile:

### 1. 🧠 High-Fidelity Resume Parsing & Scoring Pipeline
*   **Multi-Engine Text Extraction:** Extracts text from PDF and DOCX documents using `pdfplumber`, `PyMuPDF (fitz)`, and `python-docx`.
*   **Structured JSON Schema Extraction:** Feeds extracted text to Gemini LLMs utilizing strict `response_mime_type: "application/json"` formats to construct structured profiles (including Experience, Education, Projects, and Skills lists).
*   **Multivariate Scoring Engine:** Evaluates resumes on five key metrics:
    1.  *Formatting:* Document layout consistency and structure.
    2.  *Readability:* Structural scan-rate for ATS parsers.
    3.  *Skills:* Tech stack density.
    4.  *Action Verbs:* Verifying usage of strong engineering-focused verbs (e.g. *Spearheaded*, *Architected*, *Implemented*).
    5.  *Quantification:* Detection of metric-driven highlights (e.g., percentages, load improvements, revenue).

### 2. 💬 AI Resume Copilot (RAG Chat)
*   **Semantic Search Database:** Chunked resume data is embedded using `models/gemini-embedding-001` and indexed in a local **ChromaDB** vector database.
*   **Context-Aware Retrieval-Augmented Generation (RAG):** When a candidate chats with the Copilot, a vector search queries the candidate's exact background context, passing relevant resume chunks and history to Gemini.
*   **Streaming Responses:** Uses FastAPI's `StreamingResponse` to stream token-by-token advice in Server-Sent Events (SSE) format to the Next.js frontend in real-time.

### 3. 🎯 Semantic Job Matching & Deep Alignment
*   **Vector Cosine Matcher:** Measures the semantic similarity between the candidate's parsed profile and a target Job Description.
*   **Keyword & Tech Stack Gap Analysis:** Extracts required methodologies (e.g. *CI/CD*, *Microservices*) and frameworks from the JD and flags gaps in the candidate's profile.
*   **Contextual Before/After Rewrites:** Generates drop-in resume bullet points custom-fitted to the target role while maintaining truthfulness and quantifying engineering outcomes.

### 4. 🕵️‍♂️ AI Recruiter Audit & Red Flag Detector
*   **FAANG / Unicorn Screening Simulation:** Evaluates profiles against rigorous hiring bars (e.g. Stripe, Vercel, Linear, OpenAI).
*   **Red Flag Detector:** Highlights issues like short tenures, lack of metric quantification, fuzzy tech stack statements, or structural flaws.
*   **Candidate Tiering System:** Automatically tiers the candidate (Tier-1, Tier-2, Tier-3) and outlines fit roles and recommendations.

### 5. 🎤 STAR Mock Interview Engine
*   **Resume & JD Contextualization:** Initiates mock interview turns based on the resume tech stack and target role requirements.
*   **STAR Methodology Evaluation:** Analyzes candidate answers iteratively for **S**ituation, **T**ask, **A**ction, and **R**esults.
*   **Adaptive Follow-Ups:** Gemini critiques each answer, scores it (0-100), offers a "Model STAR Answer" tailored with resume details, and generates a dynamic follow-up question.

### 6. 🛠️ Interactive AI Resume Editor
*   **Command-Based Rewrite:** Candidates can select block sections and write custom prompts (e.g. *"Make this sound more senior"*, *"Quantify the results"*).
*   **On-the-Fly Scoring Updates:** Edits trigger real-time recalculations of sub-scores and re-index updated chunks in ChromaDB.

---

## 🔄 AI Hardware/SDK Fallback Architecture

To guarantee high availability and enable offline local development, the backend implements a dual-mode strategy:

```mermaid
graph TD
    A[Incoming Request] --> B{API Key Configured?}
    B -- Yes --> C[Generative LLM Engine]
    C --> D{Model Check}
    D -- Gemini 1.5 Flash Unavailable --> E[Fallback to Gemini 2.5 Flash / Pro]
    D -- Successful Connection --> F[AI Generated Output]
    E -- Success --> F
    
    B -- No --> G[spaCy NLP & Custom Regex Mock Engine]
    G --> H[Deterministic Mock Schema Output]
```

*   **Robust LLM Fallback:** The backend includes a custom wrapper class `FallbackGenerativeModel` that tries multiple models in order (`gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-pro`) if the target model fails due to 404s, deprecations, or API version limits.
*   **Rule-Based Offline Mode:** If `GEMINI_API_KEY` is not provided in environment variables, the system falls back to a custom **spaCy NLP + Regex** parsing engine, allowing the full dashboard interface to run offline with zero configuration.

---

## 🌟 Tech Stack

### Frontend
*   **Next.js 15** & TypeScript
*   **Tailwind CSS v4.0** (Dark Mode Theme, Glassmorphism, and neon gradients)
*   **Framer Motion** (Smooth transitions & micro-animations)
*   **Zustand** (Global state management)
*   **Recharts** (Interactive telemetry graphs & skills radar)
*   **Axios** (API requests with automatic JWT refresh interceptors)

### Backend
*   **FastAPI** (Python 3.13 asynchronous web framework)
*   **SQLAlchemy ORM** & **PyMySQL** (MySQL Database connectors)
*   **google-generativeai SDK** (Structured LLM interface)
*   **ChromaDB** (Vector Embeddings Store)
*   **spaCy NLP** (Tokenization & rule-based parser fallback)
*   **PyMuPDF** & **python-docx** (Document processing utilities)

---

## 📂 Project Structure

```
ATS_Checker/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI routers (Auth, Resumes, Matches, Analytics, Chat, etc.)
│   │   ├── auth/            # JWT Token creation, verification & Password Hashing
│   │   ├── ai/              # Gemini Client Wrapper, Fallbacks & Chroma Vector Store
│   │   ├── services/        # Scoring Algorithms & ATS Evaluator Engine
│   │   ├── db/              # SQLAlchemy Database session and initialization
│   │   ├── models/          # SQLAlchemy Database Models (User, Resume, JobMatch, etc.)
│   │   └── schemas/         # Pydantic Schemas for data validation
│   ├── main.py              # Backend Server entrypoint
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js Pages & Route Handlers
│   │   ├── lib/             # Zustand Stores & API Clients
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml       # Production-ready orchestration
└── README.md
```

---

## 🚀 Getting Started

### Method A: Concurrently (Recommended for Local Dev)

#### 1. Setup Backend
1.  Navigate to the backend directory and set up a virtual environment:
    ```bash
    cd backend
    python -m venv venv
    .\venv\Scripts\Activate.ps1   # Windows PowerShell
    # or: source venv/bin/activate (Linux/Mac)
    ```
2.  Install dependencies and download the NLP model:
    ```bash
    pip install -r requirements.txt
    python -m spacy download en_core_web_sm
    ```
3.  Create a `.env` file in the `backend/` folder:
    ```env
    DATABASE_URL=mysql+pymysql://root:password@127.0.0.1:3306/ats_analyzer
    SECRET_KEY=supersecret-ats-analyzer-key-change-in-prod-2026
    GEMINI_API_KEY=AIzaSy...
    FRONTEND_URL=http://localhost:3000
    ACCESS_TOKEN_EXPIRE_MINUTES=1440
    ```
    *(If DATABASE_URL is omitted, it will automatically fall back to SQLite)*
4.  Start the backend API server:
    ```bash
    python main.py
    ```

#### 2. Setup Frontend
1.  Navigate to the frontend directory:
    ```bash
    cd ../frontend
    ```
2.  Install packages:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
4.  Open the application in your browser at [http://localhost:3000](http://localhost:3000).

---

### Method B: Run with Docker Compose

1.  Add your `GEMINI_API_KEY` to the environment.
2.  Run the docker orchestration command in the root folder:
    ```bash
    docker-compose up --build
    ```
3.  Docker will boot MySQL, the FastAPI backend on port `8000`, and the Next.js app on port `3000` automatically.
