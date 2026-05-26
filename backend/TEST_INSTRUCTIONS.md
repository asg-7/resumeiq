# RAG Pipeline Testing Instructions

## Prerequisites

Ensure all required packages are installed:
```bash
pip install langchain langchain-google-genai python-dotenv fastapi uvicorn pydantic pymupdf
```

## Starting the Backend Server

From the `backend` directory:
```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

You should see output like:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

## Testing the `/analyze` Endpoint in Postman

### Setup
1. Open Postman
2. Create a new POST request
3. Set URL to: `http://localhost:8000/analyze`
4. Go to the **Body** tab and select **raw** with **JSON** format

### Test Case 1: Basic Analysis

**Request Body:**
```json
{
  "resume_text": "John Smith\n\nExperience:\n- 5 years Python development\n- Django and FastAPI framework expertise\n- REST API design and implementation\n- Database optimization with PostgreSQL\n- AWS and Docker containerization\n\nSkills:\n- Python, JavaScript, SQL\n- FastAPI, Django, React\n- Docker, Kubernetes\n- PostgreSQL, MongoDB",
  "job_description": "We are looking for a Senior Python Developer with 5+ years experience. Required: FastAPI, PostgreSQL, Docker, AWS. Nice to have: Kubernetes, React knowledge."
}
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "ats_score": 85,
    "missing_keywords": [
      "Kubernetes optimization",
      "Advanced AWS services"
    ],
    "top_matches": [
      "Python development",
      "FastAPI framework",
      "PostgreSQL expertise",
      "Docker containerization"
    ],
    "rewritten_bullets": [
      "5 years of professional Python development with FastAPI and Django",
      "Architected and deployed containerized applications using Docker and AWS"
    ],
    "company_keywords": [
      "Python",
      "FastAPI",
      "PostgreSQL",
      "Docker",
      "AWS"
    ]
  }
}
```

### Test Case 2: With Lower Match

**Request Body:**
```json
{
  "resume_text": "Jane Doe\n\nExperience:\n- 3 years Java development\n- Spring Boot applications\n- MySQL database design\n\nSkills:\n- Java, SQL\n- Spring Boot\n- MySQL, Maven",
  "job_description": "Senior Python Developer required. Must have: FastAPI, PostgreSQL, Docker, AWS, 5+ years Python experience."
}
```

**Expected Response:**
Lower ATS score (40-60) with significant missing_keywords and fewer top_matches.

## Key Features of the RAG Pipeline

✅ **Text Chunking**: Resume is split into 500-char chunks with 50-char overlap  
✅ **Context Selection**: Top 6 chunks are used for analysis  
✅ **Gemini API**: Uses gemini-1.5-flash for fast, accurate analysis  
✅ **JSON Response**: Returns structured data (ATS score, keywords, suggestions)  
✅ **Error Handling**: Catches API errors and returns proper error messages

## Troubleshooting

### Issue: "GEMINI_API_KEY not found"
- Ensure `.env` file exists in the backend directory
- Add: `GEMINI_API_KEY=your_api_key_here`

### Issue: "ModuleNotFoundError: No module named 'langchain'"
- Run: `pip install langchain langchain-google-genai`

### Issue: "Connection refused" on localhost:8000
- Make sure the server is running with the command above
- Check that port 8000 is not in use: `netstat -ano | findstr :8000`

## Response Field Meanings

- **ats_score** (0-100): How well the resume matches the job description
- **missing_keywords**: Skills/keywords mentioned in job description but missing from resume
- **top_matches**: Keywords from both resume and job description that align well
- **rewritten_bullets**: Suggested resume bullet points optimized for the job
- **company_keywords**: Key technical keywords the company is looking for
