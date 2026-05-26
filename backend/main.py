from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from resume_parser import extract_text_from_pdf
from rag_pipeline import analyze_resume
from salary_predictor import predict_salary

app = FastAPI(title="ResumeIQ Backend")


class AnalyzeRequest(BaseModel):
    resume_text: str
    job_description: str


class SalaryRequest(BaseModel):
    resume_text: str

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "ResumeIQ backend running"}

@app.post("/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    try:
        # Read the incoming file into raw memory bytes
        content = await file.read()

        # Parse it using our custom utility
        extracted_text = extract_text_from_pdf(content)

        # Return a quick preview (first 1000 characters) to verify it works
        return {
            "filename": file.filename,
            "status": "success",
            "text": extracted_text,
            "text_preview": extracted_text[:1000]
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    """Analyze resume against job description using RAG."""
    try:
        result = analyze_resume(req.resume_text, req.job_description)
        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/predict-salary")
def salary(req: SalaryRequest):
    """Predict salary based on resume text."""
    try:
        return predict_salary(req.resume_text)
    except Exception as e:
        return {"status": "error", "message": str(e)}