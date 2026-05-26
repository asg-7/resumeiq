# ResumeIQ — AI Resume Analyzer + Salary Predictor

ResumeIQ is a powerful, AI-driven application that not only evaluates your resume against a target job description but also leverages live market scraping to predict a realistic salary range specifically calibrated for the Indian IT market. 

## Table of Contents
- [Product Information](#product-information)
- [Features](#features)
- [How It Works (Code Logic & Flow)](#how-it-works-code-logic--flow)
- [Data Sources & Scraping System](#data-sources--scraping-system)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Visual Architecture](#visual-architecture)
- [Screenshots](#screenshots)

---

## Product Information
With just a single PDF upload and a Job Description paste, ResumeIQ provides an **ATS Match Score**, points out **Missing Keywords**, suggests **Rewritten Bullets**, and uses **Live Market Data** to estimate your potential salary range in Lakhs Per Annum (LPA).

It is designed to give you instant, actionable feedback in under 5 seconds, maximizing your chances of landing an interview and negotiating the best salary.

---

## Features
- **Intelligent ATS Scoring:** Calculates a precise match score (0-100) based on contextual similarity between the resume and job description.
- **Actionable Feedback:** Highlights strengths (matching keywords) and weaknesses (missing keywords).
- **Bullet Rewriter:** Suggests highly optimized, impactful resume bullet points tailored to the job description.
- **Dynamic Salary Predictor:** Extracts the user's role and scrapes live salary data from major Indian tech portals to predict Min, Median, and Max salary ranges (LPA).
- **Confidence & Negotiation:** Provides a confidence badge on the salary prediction and actionable negotiation tips.

---

## How It Works (Code Logic & Flow)

The application utilizes a **Retrieval-Augmented Generation (RAG)** pipeline. Instead of sending the entire resume to Gemini (which is token-heavy and prone to hallucinations), it:
1. **Chunks** the resume into sections.
2. **Retrieves** the most relevant chunks based on the job description.
3. **Combines** these chunks into a focused prompt.

### Code Block: RAG Pipeline Execution
```python
def analyze_resume(resume_text: str, job_description: str) -> dict:
    # 1. Chunking the text
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = text_splitter.split_text(resume_text)
    
    # 2. Embedding & Retrieval
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    vectorstore = FAISS.from_texts(chunks, embeddings)
    retriever = vectorstore.as_retriever(search_kwargs={"k": 6})
    relevant_docs = retriever.invoke(job_description)
    
    # 3. Augmentation & Generation
    context = "\n".join([doc.page_content for doc in relevant_docs])
    prompt = f"Job Description:\n{job_description}\n\nRelevant Resume Content:\n{context}\n\n..."
    response = llm.invoke(prompt)
    return json.loads(response.content)
```

### Code Block: Salary Prediction Flow
When the user clicks "Analyze", the frontend runs the salary prediction in parallel:
```javascript
// App.jsx - Parallel Execution
const [analyzeRes, salaryRes] = await Promise.all([
  axios.post(`${BACKEND_URL}/analyze`, { resume_text, job_description }),
  axios.post(`${BACKEND_URL}/predict-salary`, { resume_text })
]);
```

---

## Data Sources & Scraping System

To ensure salary predictions are accurate and reflect current Indian market rates, ResumeIQ uses an active scraping system rather than relying on outdated static CSVs.

### Where is the info taken from?
1. **Resume PDF**: The user's uploaded PDF is parsed via PyMuPDF (`fitz`).
2. **Role Extraction**: The LLM scans the parsed resume to extract the primary job title (e.g., "Senior Software Engineer").
3. **Live Web Scraping**: The `salary_scraper.py` module takes the extracted role and performs HTTP requests targeting structured salary aggregation sites.
   - **AmbitionBox**: Scrapes the specific `{role}-salaries` endpoint to extract snippets mentioning "LPA" or "Lakhs".
   - **Glassdoor India**: Scrapes Glassdoor's Indian salary search results for real-time bounds.
4. **LLM Synthesis**: If anti-bot measures temporarily block the scraper, the system automatically falls back to Gemini's extensive pre-trained knowledge base regarding the Indian tech market. 

---

## Tech Stack
- **Frontend**: React, Vite (styled with modern CSS flexbox & gradients)
- **Backend**: FastAPI, Python (Uvicorn server)
- **AI/LLM**: Google Gemini (`gemini-1.5-flash`), LangChain
- **Scraping**: `requests`, `BeautifulSoup4`
- **PDF Parsing**: PyMuPDF

---

## Getting Started

### Backend
1. `cd backend`
2. `pip install -r requirements.txt`
3. Create a `.env` file and add: `GEMINI_API_KEY=your-key`
4. Run: `uvicorn main:app --reload --host 0.0.0.0 --port 8000`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

---

## Visual Architecture
This visualizes the LangChain nodes required to build this RAG flow in LangFlow:
![LangFlow Pipeline](screenshots/langflow_pipeline.png)

## Screenshots
### Resume Analyzer Dashboard
![Resume Dashboard](screenshots/app_ui_1.png)

### Predict My Salary Range
![Predict My Salary](screenshots/app_ui_2.png)