import os
import json
import hashlib
import numpy as np
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Setup paths
AI_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(os.path.dirname(AI_DIR))
CHROMA_DIR = os.path.join(BACKEND_DIR, "chroma_db")
FALLBACK_FILE = os.path.join(CHROMA_DIR, "fallback_store.json")

os.makedirs(CHROMA_DIR, exist_ok=True)

# Check for Gemini API configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
HAS_API_KEY = len(GEMINI_API_KEY.strip()) > 0

if HAS_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Try importing chromadb
HAS_CHROMADB = False
try:
    import chromadb
    HAS_CHROMADB = True
except ImportError:
    print("WARNING: chromadb package is not installed. Using local JSON vector fallback.")


class VectorStoreManager:
    def __init__(self):
        self.use_fallback = not HAS_CHROMADB
        self.chroma_client = None
        self.collection = None

        if not self.use_fallback:
            try:
                # Initialize persistent ChromaDB client
                self.chroma_client = chromadb.PersistentClient(path=CHROMA_DIR)
                self.collection = self.chroma_client.get_or_create_collection(
                    name="resume_chunks"
                )
                print("ChromaDB vector store initialized successfully.")
            except Exception as e:
                print(f"Error initializing ChromaDB: {e}. Switching to JSON fallback.")
                self.use_fallback = True

        if self.use_fallback:
            self._init_fallback_store()
            print("JSON fallback vector store initialized.")

    def _init_fallback_store(self):
        if not os.path.exists(FALLBACK_FILE):
            with open(FALLBACK_FILE, "w") as f:
                json.dump({"documents": []}, f)

    def _load_fallback_store(self) -> List[Dict[str, Any]]:
        try:
            with open(FALLBACK_FILE, "r") as f:
                data = json.load(f)
                return data.get("documents", [])
        except Exception:
            return []

    def _save_fallback_store(self, documents: List[Dict[str, Any]]):
        try:
            with open(FALLBACK_FILE, "w") as f:
                json.dump({"documents": documents}, f, indent=2)
        except Exception as e:
            print(f"Failed to save fallback vector store: {e}")

    def get_embedding(self, text: str) -> List[float]:
        """Generates embedding for a string. Uses Gemini if online, else deterministic hash."""
        if not text.strip():
            return [0.0] * 3072

        if HAS_API_KEY:
            try:
                # Gemini embedding API returns a 3072-dimension vector
                response = genai.embed_content(
                    model="models/gemini-embedding-001",
                    content=text,
                    task_type="retrieval_document"
                )
                return response["embedding"]
            except Exception as e:
                print(f"Gemini embedding generation failed: {e}. Using deterministic hash fallback.")

        # Deterministic Word-Hash vector generator (fallback)
        dim = 3072
        words = text.lower().split()
        if not words:
            return [0.0] * dim
            
        vec = np.zeros(dim)
        for w in words:
            # Seed based on word md5 hash
            h = int(hashlib.md5(w.encode("utf-8")).hexdigest(), 16)
            np.random.seed(h % (2**32))
            vec += np.random.randn(dim)
            
        # Normalize
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    def add_resume(self, resume_id: int, user_id: int, parsed_json: Dict[str, Any], raw_text: str):
        """Chunks and indexes resume contents."""
        chunks = []
        
        # 1. Summary chunk
        summary = parsed_json.get("summary", "")
        if summary:
            chunks.append(("summary", f"Professional Summary: {summary}"))
            
        # 2. Skills chunk
        skills = parsed_json.get("skills", [])
        if skills:
            chunks.append(("skills", f"Technical Skills: {', '.join(skills)}"))
            
        # 3. Work experience chunks
        experience = parsed_json.get("experience", [])
        for idx, exp in enumerate(experience):
            company = exp.get("company", "")
            role = exp.get("role", "")
            duration = exp.get("duration", "")
            highlights = ". ".join(exp.get("highlights", []))
            chunk_text = f"Work Experience at {company} as {role} ({duration}): {highlights}"
            chunks.append((f"experience_{idx}", chunk_text))
            
        # 4. Project chunks
        projects = parsed_json.get("projects", [])
        for idx, proj in enumerate(projects):
            title = proj.get("title", "")
            desc = proj.get("description", "")
            highlights = ". ".join(proj.get("highlights", []))
            chunk_text = f"Project '{title}' - {desc}. Highlights: {highlights}"
            chunks.append((f"project_{idx}", chunk_text))

        # Fallback to indexing raw text if no chunks are extracted
        if not chunks and raw_text:
            # Split raw text into paragraphs
            paragraphs = [p.strip() for p in raw_text.split("\n\n") if p.strip()]
            for idx, p in enumerate(paragraphs[:10]):  # Limit to 10 paragraphs
                chunks.append((f"raw_section_{idx}", p))

        if not chunks:
            return

        # Prepare payload
        docs = [c[1] for c in chunks]
        ids = [f"resume_{resume_id}_{c[0]}" for c in chunks]
        metadatas = [{"resume_id": resume_id, "user_id": user_id, "type": c[0]} for c in chunks]
        embeddings = [self.get_embedding(d) for d in docs]

        if not self.use_fallback:
            try:
                # Delete existing entries for this resume to prevent duplicate index entries
                self.delete_resume(resume_id)
                self.collection.add(
                    documents=docs,
                    ids=ids,
                    metadatas=metadatas,
                    embeddings=embeddings
                )
            except Exception as e:
                print(f"Error adding to ChromaDB: {e}. Falling back to JSON store.")
                self.use_fallback = True

        if self.use_fallback:
            # Remove existing entries in fallback
            all_docs = self._load_fallback_store()
            filtered_docs = [d for d in all_docs if d.get("resume_id") != resume_id]
            
            # Add new entries
            for i in range(len(docs)):
                filtered_docs.append({
                    "id": ids[i],
                    "resume_id": resume_id,
                    "user_id": user_id,
                    "type": metadatas[i]["type"],
                    "text": docs[i],
                    "embedding": embeddings[i]
                })
            self._save_fallback_store(filtered_docs)

    def delete_resume(self, resume_id: int):
        """Removes resume chunks from vector store."""
        if not self.use_fallback:
            try:
                self.collection.delete(where={"resume_id": resume_id})
            except Exception as e:
                print(f"Error deleting from ChromaDB: {e}. Trying fallback store.")
                self.use_fallback = True

        if self.use_fallback:
            all_docs = self._load_fallback_store()
            filtered_docs = [d for d in all_docs if d.get("resume_id") != resume_id]
            self._save_fallback_store(filtered_docs)

    def query_resume(self, resume_id: int, query_text: str, n_results: int = 4) -> List[str]:
        """Queries relevant chunks for a resume."""
        query_embedding = self.get_embedding(query_text)

        if not self.use_fallback:
            try:
                results = self.collection.query(
                    query_embeddings=[query_embedding],
                    n_results=n_results,
                    where={"resume_id": resume_id}
                )
                # Results contains list of lists
                documents = results.get("documents", [])
                return documents[0] if documents else []
            except Exception as e:
                print(f"Error querying ChromaDB: {e}. Switching to JSON fallback.")
                self.use_fallback = True

        if self.use_fallback:
            all_docs = self._load_fallback_store()
            # Filter by resume_id
            filtered_docs = [d for d in all_docs if d.get("resume_id") == resume_id]
            if not filtered_docs:
                return []

            # Compute cosine similarities
            scored_docs = []
            q_vec = np.array(query_embedding)
            q_norm = np.linalg.norm(q_vec)

            for doc in filtered_docs:
                doc_vec = np.array(doc["embedding"])
                doc_norm = np.linalg.norm(doc_vec)
                if q_norm > 0 and doc_norm > 0:
                    similarity = np.dot(q_vec, doc_vec) / (q_norm * doc_norm)
                else:
                    similarity = 0.0
                scored_docs.append((similarity, doc["text"]))

            # Sort by similarity descending
            scored_docs.sort(key=lambda x: x[0], reverse=True)
            return [text for score, text in scored_docs[:n_results]]

# Singleton instance
vector_store = VectorStoreManager()
