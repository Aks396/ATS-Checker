import io
import fitz  # PyMuPDF
import pdfplumber
import docx
from fastapi import HTTPException

def extract_text_from_pdf_pymupdf(file_bytes: bytes) -> str:
    """Extracts text using PyMuPDF (fast, reliable)."""
    text = ""
    try:
        # Open PDF from memory
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page in doc:
            text += page.get_text()
        doc.close()
    except Exception as e:
        print(f"PyMuPDF error: {e}")
        raise ValueError("Failed to extract text using PyMuPDF")
    return text

def extract_text_from_pdf_pdfplumber(file_bytes: bytes) -> str:
    """Extracts text using pdfplumber (fallback/layout-friendly)."""
    text = ""
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
    except Exception as e:
        print(f"pdfplumber error: {e}")
        raise ValueError("Failed to extract text using pdfplumber")
    return text

def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extracts text from DOCX using python-docx."""
    try:
        doc = docx.Document(io.BytesIO(file_bytes))
        full_text = []
        for para in doc.paragraphs:
            full_text.append(para.text)
        return "\n".join(full_text)
    except Exception as e:
        print(f"python-docx error: {e}")
        raise ValueError("Failed to extract text from DOCX file")

def parse_file(filename: str, file_bytes: bytes) -> str:
    """Routes the file to the correct parser based on extension."""
    ext = filename.split(".")[-1].lower()
    
    if ext == "pdf":
        # Attempt PyMuPDF, fallback to pdfplumber
        try:
            text = extract_text_from_pdf_pymupdf(file_bytes)
            if not text.strip():
                # If PyMuPDF returned blank text (could be image-only, or parse failure)
                text = extract_text_from_pdf_pdfplumber(file_bytes)
            return text
        except Exception:
            try:
                return extract_text_from_pdf_pdfplumber(file_bytes)
            except Exception as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Could not parse PDF file: {str(e)}"
                )
    elif ext in ["docx", "doc"]:
        try:
            return extract_text_from_docx(file_bytes)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Could not parse DOCX file: {str(e)}"
            )
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format: .{ext}. Only PDF and DOCX are supported."
        )
