# ResumeIQ — AI Resume Analyzer + Salary Predictor

> **Live Demo:** _https://resumeiq.vercel.app_ (update after Vercel deployment)

ResumeIQ is a powerful, AI-driven application that evaluates your resume against a target job description, calculates an ATS match score, and leverages live market scraping to predict a realistic salary range calibrated for the Indian IT market.

---

## Table of Contents
- [What It Does](#what-it-does)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [How It Works — Code Logic & Flow](#how-it-works--code-logic--flow)
- [Data Sources & Scraping System](#data-sources--scraping-system)
- [How to Run Locally](#how-to-run-locally)
- [Deployment](#deployment)
- [Screenshots](#screenshots)
- [Limitations](#limitations)
- [Interview Talking Points](#interview-talking-points)

---

## What It Does
With a **single PDF upload** and a **job description paste**, ResumeIQ provides:
1. An **ATS Match Score** (0–100) measuring keyword and context alignment.
2. **Missing Keywords** — what the JD asks for that your resume lacks.
3. **Rewritten Bullets** — AI-optimized resume bullet points tailored to the JD.
4. **Salary Prediction** — Min, Median, Max salary in LPA using live market data scraping + LLM reasoning.
5. **PDF Export** — Download all improvement suggestions as a clean PDF.
6. **Multi-JD Comparison** — Paste two JDs and see which role is a better fit, side by side.

---

## Features
| Feature | Description |
|---|---|
| **ATS Scoring** | Contextual match score using RAG + Gemini |
| **Keyword Analysis** | Matching strengths and missing gaps |
| **Bullet Rewriter** | Optimized bullet suggestions per JD |
| **Salary Predictor** | Live-scraped market data + LLM prediction |
| **Confidence Badge** | Green/Yellow/Red badge on salary predictions |
| **PDF Export** | Download tips as `ResumeIQ_Tips.pdf` via jsPDF |
| **Multi-JD Compare** | Side-by-side comparison of two job descriptions |
| **Negotiation Tips** | Highlighted negotiation strategies |

---

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React, Vite, jsPDF |
| Backend | FastAPI, Python, Uvicorn |
| AI / LLM | Google Gemini (`gemini-1.5-flash`), LangChain |
| Scraping | `requests`, `BeautifulSoup4` (AmbitionBox, Glassdoor India) |
| PDF Parsing | PyMuPDF (`fitz`) |

---

## Architecture

The system follows a **Retrieval-Augmented Generation (RAG)** architecture:

> Instead of sending the entire resume to Gemini, I chunk it into sections, retrieve the most relevant ones, and combine them with the job description. This reduces token cost and improves accuracy.

![LangFlow Pipeline](screenshots/langflow_pipeline.png)

```
┌──────────────────┐     ┌──────────────┐     ┌──────────────┐
│  PDF Upload      │────▶│ PyMuPDF      │────▶│ Text Chunking│
│  (React Frontend)│     │ (fitz)       │     │ (500 chars)  │
└──────────────────┘     └──────────────┘     └──────┬───────┘
                                                      │
                                                      ▼
┌──────────────────┐     ┌──────────────┐     ┌──────────────┐
│  JSON Response   │◀────│ Gemini Flash │◀────│ RAG Prompt   │
│  (ATS + Salary)  │     │ (LLM)       │     │ (Top 6 Chunks│
└──────────────────┘     └──────────────┘     │ + JD Context)│
                                              └──────────────┘
```

---

## How It Works — Code Logic & Flow

### 1. Resume Parsing (`resume_parser.py`)
```python
import fitz  # PyMuPDF

def extract_text_from_pdf(file_bytes: bytes) -> str:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    return text.strip()
```
The raw PDF bytes are read page-by-page into a single clean string.

### 2. RAG Analysis (`rag_pipeline.py`)
```python
def analyze_resume(resume_text: str, job_description: str) -> dict:
    # 1. Chunk the resume into 500-char blocks with 50-char overlap
    chunks = chunk_resume(resume_text)

    # 2. Take the top 6 chunks as context (most relevant sections)
    context = '\n---\n'.join(chunks[:6])

    # 3. Extract company-specific keywords from the JD
    company_kws = get_company_keywords(job_description)

    # 4. Send context + JD + keywords to Gemini for structured analysis
    prompt = f"RESUME:\n{context}\n\nJOB DESCRIPTION:\n{job_description}\n..."
    response = llm.invoke(prompt)
    return json.loads(response.content)
```

### 3. Salary Prediction (`salary_predictor.py`)
A three-step pipeline:
1. **Extract Role**: LLM scans the resume text to determine the primary job title.
2. **Scrape Market Data**: `salary_scraper.py` hits AmbitionBox and Glassdoor India for live salary snippets.
3. **Predict**: Gemini combines the resume, extracted role, and scraped data to output a structured JSON with min/median/max salary, confidence, reasoning, and negotiation tip.

### 4. Frontend Parallel Execution (`App.jsx`)
```javascript
const [analyzeRes, salaryRes] = await Promise.all([
  axios.post(`${BACKEND_URL}/analyze`, { resume_text, job_description }),
  axios.post(`${BACKEND_URL}/predict-salary`, { resume_text })
])
```
Both API calls fire simultaneously for faster results.

### 5. Multi-JD Comparison (`/compare-jd` endpoint)
```javascript
const compareRes = await axios.post(`${BACKEND_URL}/compare-jd`, {
  resume_text: resumeText,
  job_description_1: jobDescription,
  job_description_2: jobDescription2
})
```
The backend analyzes the resume against both JDs and returns side-by-side results with ATS scores, so the user can see which role is a better fit.

### 6. PDF Export (`jsPDF`)
```javascript
import { jsPDF } from 'jspdf'
// Generates a downloadable PDF with all ATS tips, missing keywords,
// rewritten bullets, and salary prediction details.
doc.save('ResumeIQ_Tips.pdf')
```

---

## Data Sources & Scraping System

| Source | What We Scrape | How |
|---|---|---|
| **AmbitionBox** | Salary ranges by role | HTTP GET → BeautifulSoup → regex for "LPA" / "Lakhs" |
| **Glassdoor India** | Salary search results | HTTP GET → BeautifulSoup → regex extraction |
| **Gemini LLM** (fallback) | Pre-trained Indian market knowledge | Used when anti-bot blocks scraping |
| **Resume PDF** | Full text content | PyMuPDF (`fitz`) page-by-page extraction |

---

## How to Run Locally

### Backend
```bash
cd backend
pip install -r requirements.txt
# Create .env file
echo GEMINI_API_KEY=your-api-key > .env
# Start server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

---

## Deployment

### Backend → Render.com
1. Create a free account at [render.com](https://render.com).
2. New Web Service → Connect GitHub → Select `resumeiq` repo.
3. Set root directory to `backend/`.
4. Add environment variable: `GEMINI_API_KEY = your-key`.
5. Render auto-deploys. URL: `https://resumeiq-backend.onrender.com`.

### Frontend → Vercel
1. Create a free account at [vercel.com](https://vercel.com).
2. Import Git Repository → Select `resumeiq`.
3. Set root directory to `frontend/`.
4. Deploy. URL: `https://resumeiq.vercel.app`.

---

## Screenshots

### Resume Analyzer Dashboard
![Resume Dashboard](screenshots/app_ui_1.png)

### Salary Prediction
![Salary Predictor](screenshots/app_ui_2.png)

---

## Limitations

- **Salary predictions are estimates** based on scraped data and LLM reasoning. They should be used as a reference point, not as guaranteed figures.
- **ATS scoring is approximate** — real ATS systems vary between companies and may weight criteria differently.
- **Company keyword list is manually curated** and may not cover all organizations.
- **Scraping depends on site availability** — AmbitionBox and Glassdoor may block requests, in which case the system falls back to Gemini's pre-trained knowledge.
- **Resume parsing quality** depends on PDF formatting — poorly formatted or image-based PDFs may not extract cleanly.

---

## Interview Talking Points

### 1. What is RAG and why did you use it?
> RAG (Retrieval-Augmented Generation) is a technique where, instead of sending the entire document to an LLM, you first chunk it, retrieve the most relevant pieces, and then send only those to the model along with context. I used it because resumes can be long, and sending everything wastes tokens and reduces accuracy. By chunking into 500-char blocks and selecting the top 6 chunks relevant to the JD, I get more precise ATS scoring and better keyword matching.

### 2. Why LangChain instead of calling Gemini directly?
> LangChain provides a standardized interface for text splitting, prompt management, and chaining multiple LLM calls. It also makes it trivial to swap models (e.g., from Gemini to GPT-4) without rewriting business logic. The `RecursiveCharacterTextSplitter` handles intelligent chunking with overlap, which would be boilerplate to implement manually.

### 3. How does the salary predictor avoid hallucinating numbers?
> Three safeguards: (1) I scrape real salary data from AmbitionBox and Glassdoor India for the specific extracted role, so the LLM has real market context. (2) The prompt explicitly asks for LPA ranges matching Indian IT market rates. (3) A confidence badge (high/medium/low) is returned, so the user knows how reliable the estimate is — if the scraper was blocked and the LLM had to rely on general knowledge, confidence drops accordingly.