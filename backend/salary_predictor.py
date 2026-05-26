import csv
import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

load_dotenv()

def load_salary_context() -> str:
    rows = []
    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(base_dir, 'salary_data.csv')
    with open(csv_path, encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in list(reader)[:120]:  # Load up to 120 rows to give a slightly richer context
            rows.append(f"{row.get('role','')}, {row.get('experience','')} yrs, {row.get('salary','')} LPA")
    return '\n'.join(rows)

def predict_salary(resume_text: str) -> dict:
    context = load_salary_context()
    llm = ChatGoogleGenerativeAI(
        model='gemini-1.5-flash',
        google_api_key=os.getenv('GEMINI_API_KEY')
    )
    prompt = f'''Resume:
{resume_text[:2000]}

Market Data:
{context}

Based on the resume content and matching experience levels, predict a realistic Indian IT salary range in LPA (Lakhs Per Annum) for the candidate. Use the market data for context where relevant.

Respond ONLY with valid JSON. Do not include markdown code block backticks (like ```json).
{{"extracted_role":"","years_of_experience":0,"college_tier":"","tech_stack":[],"min_salary_lpa":0,"max_salary_lpa":0,"median_salary_lpa":0,"confidence":"","reasoning":"","negotiation_tip":""}}'''
    
    response = llm.invoke(prompt)
    content = response.content.strip()
    
    # Strip markdown formatting if the model still includes it
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
        # Fallback in case JSON parsing fails
        print(f"JSON parsing error: {e}. Raw content: {content}")
        # Let's try to extract JSON using a regex or simple substring or return a default dict
        import re
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except:
                pass
        raise e
