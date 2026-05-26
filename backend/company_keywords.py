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
    for company, kws in COMPANY_KEYWORDS.items():
        if company in jd.lower():
            return kws
    return COMPANY_KEYWORDS['default']
