# 🏢 Company Keywords Feature - Quick Test

## What's New
Company-specific keywords are now automatically detected and injected into the analysis to help candidates optimize their resumes for specific companies.

## Files Added
- `backend/company_keywords.py` - Company keyword database and detection logic
- `backend/test_company_keywords.py` - Comprehensive test suite
- `backend/COMPANY_KEYWORDS_GUIDE.md` - Full documentation

## Quick Test

### Test Amazon Suggestions
```bash
# Start server (if not running)
python -m uvicorn main:app --reload

# In another terminal, run tests
python test_company_keywords.py
```

### Manual Test with Postman
POST to `http://localhost:8000/analyze`:

**Amazon Test:**
```json
{
  "resume_text": "5 years experience. Strong ownership mentality. Delivered results consistently. Customer-focused approach.",
  "job_description": "Senior Engineer at Amazon. We value ownership, bias for action, customer obsession, and delivering results."
}
```

**Expected:** Suggestions should include Amazon keywords like "ownership", "bias for action", "deliver results", "customer obsession"

---

**Google Test:**
```json
{
  "resume_text": "Experienced engineer. Data-driven approach. Built scalable systems for millions of users.",
  "job_description": "Software Engineer at Google. We need someone who thinks about scalability, is data-driven, and thrives in ambiguity."
}
```

**Expected:** Suggestions should emphasize "scalability", "data-driven", "impact at scale", "ambiguity"

---

**Generic Test (No Company Match):**
```json
{
  "resume_text": "Developer with team experience",
  "job_description": "Software developer needed. Must be a team player."
}
```

**Expected:** Default keywords used: "leadership", "collaboration", "problem-solving", "impact"

## Supported Companies
| Company | Keywords |
|---------|----------|
| Amazon | ownership, customer obsession, dive deep, deliver results, bias for action |
| Google | scalability, data-driven, impact at scale, ambiguity |
| Microsoft | growth mindset, inclusive, empowerment, clarity |
| Flipkart | first principles, speed, execution, consumer first |
| TCS | agile, stakeholder management, delivery, SDLC |
| Default | leadership, collaboration, problem-solving, impact |

## How It Works
1. Backend receives job description + resume
2. `get_company_keywords()` scans JD for company name
3. Matching keywords are retrieved
4. Keywords are added to the Gemini prompt with instruction to use them naturally
5. Gemini generates suggestions incorporating these keywords

## Expected Response
```json
{
  "status": "success",
  "data": {
    "ats_score": 85,
    "company_keywords": [
      "ownership",
      "customer obsession",
      "bias for action"
    ],
    "rewritten_bullets": [
      "Took ownership of critical initiatives with bias for action",
      "Customer-obsessed approach to feature development"
    ],
    "missing_keywords": ["dive deep"],
    "top_matches": ["ownership", "delivery"]
  }
}
```

## Adding More Companies
Edit `backend/company_keywords.py`:
```python
COMPANY_KEYWORDS = {
    # ... existing ...
    'your_company': ['keyword1', 'keyword2', 'keyword3'],
}
```

Done! The system auto-detects on the next analysis.

---

✅ **Integration Complete!** The company keywords feature is fully integrated with the RAG pipeline.
