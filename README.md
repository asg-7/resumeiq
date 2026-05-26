# ResumeIQ — AI Resume Analyzer + Salary Predictor

## What it does
ResumeIQ is an AI-powered application that analyzes your resume against a job description, calculates an ATS match score, and predicts your expected salary based on market data. With a single PDF upload, you get tailored resume bullets, missing keyword suggestions, and negotiation tips to land your dream job at the right salary!

## Tech Stack
- **Frontend**: React, Vite
- **Backend**: FastAPI, Python
- **AI/LLM**: Google Gemini (gemini-1.5-flash), LangChain
- **PDF Parsing**: PyMuPDF

## Architecture
Instead of sending the entire resume to Gemini, I chunk it into sections, retrieve the most relevant ones, and combine them with the job description. This reduces token cost and improves accuracy.

![LangFlow Pipeline](screenshots/langflow_pipeline.png)

## How to Run

### Backend
1. Navigate to the `backend/` directory.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a `.env` file and add your Google Gemini API Key:
   ```env
   GEMINI_API_KEY=your-api-key
   ```
4. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend
1. Navigate to the `frontend/` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Features
- **ATS Match Score**: Evaluates your resume against a target job description.
- **Smart Recommendations**: Identifies missing keywords and rewrites bullet points for better impact.
- **Salary Predictor**: Uses AI and market data to estimate your salary range (Min - Median - Max).
- **Fast & Efficient**: Uses RAG (Retrieval-Augmented Generation) to process resumes locally and only send relevant chunks to the LLM.

## Screenshots

### Resume Analyzer Dashboard
![Resume Dashboard](screenshots/app_ui_1.png)

### Predict My Salary Range
![Predict My Salary](screenshots/app_ui_2.png)