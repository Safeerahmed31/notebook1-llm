from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv()

from extractor import extract, SUPPORTED
from llm import (
    vision_extract,
    summarize,
    generate_quiz,
    ask_question,
    generate_expected_questions,
)

# ─────────────────────────────────────────────
# App Setup
# ─────────────────────────────────────────────
app = FastAPI(title="Notebook LLM API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # ✅ allow all for deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_MB = int(os.getenv("MAX_UPLOAD_MB", "20"))


# ─────────────────────────────────────────────
# Schemas
# ─────────────────────────────────────────────
class ProcessRequest(BaseModel):
    text: str
    num_questions: Optional[int] = 5


class ChatRequest(BaseModel):
    question: str
    text: str


# ─────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}


# ── Upload
@app.post("/api/upload")
async def upload(file: UploadFile = File(...)):
    ext = Path(file.filename).suffix.lower()

    if ext not in SUPPORTED:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {ext}",
        )

    data = await file.read()

    if len(data) > MAX_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large")

    try:
        content, is_image, mime = extract(data, file.filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction error: {e}")

    if is_image:
        content = vision_extract(content, mime)

    content = content.strip()

    if not content:
        raise HTTPException(status_code=422, detail="No text extracted")

    return {
        "filename": file.filename,
        "text": content,
        "word_count": len(content.split()),
        "char_count": len(content),
    }


# ── Summary
@app.post("/api/summarize")
def summarize_route(req: ProcessRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text is empty")

    return {"summary": summarize(req.text)}


# ── Quiz
@app.post("/api/quiz")
def quiz_route(req: ProcessRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text is empty")

    n = max(1, min(req.num_questions or 5, 10))
    questions = generate_quiz(req.text, n)

    return {"questions": questions}


# ── Chat
@app.post("/api/chat")
def chat(req: ChatRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question is empty")

    answer = ask_question(req.text, req.question)
    return {"answer": answer}


# ── Expected Questions (🔥 NEW)
@app.post("/api/questions")
def expected_questions(req: ProcessRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text is empty")

    result = generate_expected_questions(req.text)
    return {"questions": result}