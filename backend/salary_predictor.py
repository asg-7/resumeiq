import os
import json
import re
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
from salary_scraper import scrape_salary_data

load_dotenv()

def extract_role_from_resume(resume_text: str, llm) -> str:
    """Quickly extract the primary job role from the resume to use for scraping."""
    prompt = f"Resume:\\n{resume_text[:2000]}\\n\\nWhat is the primary job role or title of this candidate? Respond with ONLY the job title (e.g., 'Software Engineer', 'Data Analyst')."
    try:
        response = llm.invoke(prompt)
        return response.content.strip()
    except:
        return "Software Engineer" # Fallback

def predict_salary(resume_text: str) -> dict:
    llm = ChatGoogleGenerativeAI(
        model='gemini-1.5-flash',
        google_api_key=os.getenv('GEMINI_API_KEY')
    )
    
    # Step 1: Extract the role
    role = extract_role_from_resume(resume_text, llm)
    
    # Step 2: Scrape live market data for this role
    market_context = scrape_salary_data(role)
    
    # Step 3: Predict salary
    prompt = f'''Resume:
{resume_text[:2000]}

Scraped Market Data Context for {role}:
{market_context}

Based on the resume content, the extracted role "{role}", and matching experience levels, predict a realistic Indian IT salary range in LPA (Lakhs Per Annum) for the candidate. Use the market data for context where relevant, or rely on your extensive pre-trained knowledge of the Indian market.

Respond ONLY with valid JSON. Do not include markdown code block backticks (like ```json).
{{"extracted_role":"{role}","years_of_experience":0,"college_tier":"","tech_stack":[],"min_salary_lpa":0,"max_salary_lpa":0,"median_salary_lpa":0,"confidence":"","reasoning":"","negotiation_tip":""}}'''
    
    response = llm.invoke(prompt)
    content = response.content.strip()
    
    if content.startswith("```"):
        lines = content.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        content = "\n".join(lines).strip()
        
    try:
        return json.loads(content)
    except Exception as e:
        print(f"JSON parsing error: {e}. Raw content: {content}")
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except:
                pass
        raise e
