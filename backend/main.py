from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from resume_parser import extract_text_from_pdf

app = FastAPI(title="ResumeIQ Backend")

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
            "text_preview": extracted_text[:1000]
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}