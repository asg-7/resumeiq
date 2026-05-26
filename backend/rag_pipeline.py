from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import ChatGoogleGenerativeAI
import os
import json
from dotenv import load_dotenv
from company_keywords import get_company_keywords

load_dotenv()


def chunk_resume(text: str):
    """Split resume text into manageable chunks for RAG processing."""
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    return splitter.split_text(text)


def analyze_resume(resume_text: str, job_description: str) -> dict:
    """Analyze resume against job description using RAG approach."""
    chunks = chunk_resume(resume_text)
    # Use top 6 chunks for context
    context = '\n---\n'.join(chunks[:6])
    
    # Get company-specific keywords
    company_kws = get_company_keywords(job_description)
    company_kws_str = ', '.join(company_kws)
    
    llm = ChatGoogleGenerativeAI(
        model='gemini-1.5-flash',
        google_api_key=os.getenv('GEMINI_API_KEY')
    )
    
    prompt = f'''RESUME:
{context}

JOB DESCRIPTION:
{job_description}

Company-specific keywords to consider where relevant: {company_kws_str}

Respond ONLY with valid JSON, no markdown or code blocks:
{{"ats_score": 0-100, "missing_keywords": [], "top_matches": [], "rewritten_bullets": [], "company_keywords": []}}'''
    
    response = llm.invoke(prompt)
    return json.loads(response.content)
