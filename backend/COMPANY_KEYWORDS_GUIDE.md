# Company-Specific Keywords Feature

## Overview
The RAG pipeline now detects the company in the job description and injects company-specific cultural keywords into the analysis. This helps candidates optimize their resume with language that resonates with each company's values and culture.

## Implementation

### 1. `company_keywords.py`
Defines company-specific keywords for major tech companies:

```python
COMPANY_KEYWORDS = {
    'amazon': ['ownership', 'customer obsession', 'dive deep', 'deliver results', 'bias for action'],
    'google': ['scalability', 'data-driven', 'impact at scale', 'ambiguity'],
    'microsoft': ['growth mindset', 'inclusive', 'empowerment', 'clarity'],
    'flipkart': ['first principles', 'speed', 'execution', 'consumer first'],
    'tcs': ['agile', 'stakeholder management', 'delivery', 'SDLC'],
    'default': ['leadership', 'collaboration', 'problem-solving', 'impact']
}

def get_company_keywords(jd: str) -> list:
    """Extract company-specific keywords from job description."""
```

### 2. Updated `rag_pipeline.py`
Now imports and uses company keywords:

```python
from company_keywords import get_company_keywords

def analyze_resume(resume_text: str, job_description: str) -> dict:
    # ... existing code ...
    
    # Get company-specific keywords
    company_kws = get_company_keywords(job_description)
    company_kws_str = ', '.join(company_kws)
    
    # Inject into Gemini prompt
    prompt = f'''...
Company-specific keywords to consider where relevant: {company_kws_str}
...'''
```

## How It Works

1. **Detection**: When a job description is received, the system scans for company names
2. **Keyword Lookup**: If a match is found, corresponding keywords are retrieved
3. **Prompt Injection**: Keywords are added to the Gemini prompt with instruction to consider them
4. **Suggestion Generation**: Gemini generates resume suggestions that incorporate these keywords naturally

## Supported Companies

| Company | Keywords |
|---------|----------|
| **Amazon** | ownership, customer obsession, dive deep, deliver results, bias for action |
| **Google** | scalability, data-driven, impact at scale, ambiguity |
| **Microsoft** | growth mindset, inclusive, empowerment, clarity |
| **Flipkart** | first principles, speed, execution, consumer first |
| **TCS** | agile, stakeholder management, delivery, SDLC |
| **Default** | leadership, collaboration, problem-solving, impact |

## Testing

### Test the Feature
```bash
python test_company_keywords.py
```

This runs three tests:
1. **Amazon JD** - Verifies "ownership", "bias for action", etc. are suggested
2. **Google JD** - Verifies "scalability", "data-driven", etc. are suggested
3. **Generic JD** - Verifies default keywords are used as fallback

### Example Request (Amazon)
```json
{
  "resume_text": "5 years experience with focus on ownership and delivering results...",
  "job_description": "Senior Software Engineer at Amazon. We value ownership, bias for action, and delivering results..."
}
```

### Expected Output
```json
{
  "status": "success",
  "data": {
    "ats_score": 88,
    "company_keywords": [
      "ownership",
      "customer obsession",
      "bias for action",
      "deliver results"
    ],
    "rewritten_bullets": [
      "Took ownership of critical projects, driving delivery with bias for action",
      "Customer-obsessed approach led to key feature adoption"
    ]
  }
}
```

## Adding New Companies

To add support for more companies, simply add an entry to `COMPANY_KEYWORDS`:

```python
COMPANY_KEYWORDS = {
    # ... existing entries ...
    'netflix': ['innovation', 'freedom', 'responsibility', 'speed'],
    'tesla': ['mission-driven', 'efficiency', 'innovation', 'ownership'],
}
```

## How Gemini Uses These Keywords

The prompt instructs Gemini to:
- **Consider** the company-specific keywords where relevant
- **Incorporate** them naturally into rewritten bullets
- **Include** them in suggestions without forcing them unnaturally
- **Prioritize** authenticity over keyword stuffing

Example instruction in prompt:
```
Company-specific keywords to consider where relevant: ownership, customer obsession, dive deep, deliver results, bias for action

Suggest resume improvements that naturally incorporate these concepts.
```

## Benefits

✅ **Better Matching**: Suggestions align with company culture  
✅ **ATS Optimization**: Keywords improve resume scoring  
✅ **Cultural Fit**: Candidates demonstrate understanding of company values  
✅ **Authenticity**: Keywords are suggested naturally, not forced  
✅ **Scalability**: Easy to add more companies  

## Notes

- Company detection is **case-insensitive** (searches for company name in lowercase JD)
- If no company match is found, **default keywords** are used
- Keywords are **suggestions only** - Gemini decides how to incorporate them
- The system is **non-intrusive** - it enhances but doesn't force keyword stuffing
