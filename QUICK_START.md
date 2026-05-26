# 🚀 ResumeIQ RAG Pipeline - Quick Start

## What's New

✅ **RAG (Retrieval-Augmented Generation) Pipeline** implemented for smart resume analysis!

## 3 Files Added to Backend

1. **rag_pipeline.py** - Core RAG logic (chunk resume → analyze with Gemini)
2. **main.py** - Updated with `/analyze` endpoint
3. **test_rag.py** - Test script to verify everything works

## Start Using It

### Step 1: Install Dependencies
```bash
cd backend
pip install langchain langchain-google-genai python-dotenv fastapi uvicorn pydantic pymupdf
```

### Step 2: Start the Server
```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

You'll see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 3: Test the Endpoint
```bash
# In another terminal
python test_rag.py
```

Or use Postman to POST to `http://localhost:8000/analyze`:
```json
{
  "resume_text": "5 years Python, FastAPI, PostgreSQL...",
  "job_description": "Senior Python Dev needed..."
}
```

## What You Get

Returns JSON with:
- **ats_score** (0-100): Match quality
- **missing_keywords**: Skills to add
- **top_matches**: What aligns well
- **rewritten_bullets**: Better resume phrasing
- **company_keywords**: Required tech stack

## Example Response
```json
{
  "status": "success",
  "data": {
    "ats_score": 85,
    "missing_keywords": ["Kubernetes"],
    "top_matches": ["Python", "FastAPI", "PostgreSQL"],
    "rewritten_bullets": ["5 years Python/FastAPI development..."],
    "company_keywords": ["Python", "FastAPI", "PostgreSQL", "Docker"]
  }
}
```

## How RAG Works

1. **Resume Chunking** (500 chars/chunk)
   - Breaks resume into manageable pieces
   - Keeps context with 50-char overlap

2. **Selective Context** (top 6 chunks)
   - Uses only the most relevant resume sections
   - Sends to Gemini AI with job description

3. **Smart Analysis**
   - Compares resume against job requirements
   - Generates optimization suggestions
   - Returns structured JSON

## Existing Endpoints

- `GET /` - Health check
- `POST /parse-resume` - Upload PDF (existing)
- `POST /analyze` - **NEW** RAG analysis

## Files to Read

- `backend/RAG_IMPLEMENTATION.md` - Full technical details
- `backend/TEST_INSTRUCTIONS.md` - Detailed testing guide
- `backend/test_rag.py` - Runnable test with examples

---

**That's it!** Your RAG pipeline is ready to use. 🎉
