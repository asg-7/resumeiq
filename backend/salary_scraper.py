import requests
from bs4 import BeautifulSoup
import re

def scrape_salary_data(role: str) -> str:
    """
    Attempts to scrape live salary data from popular Indian salary aggregators (e.g., AmbitionBox, Glassdoor India).
    Returns a context string of raw scraped text to feed into the LLM.
    If anti-bot mechanisms block the request, it returns an empty string or a fallback indicator.
    """
    context_data = []
    
    # Format the role for URL (e.g., "Software Engineer" -> "software-engineer")
    formatted_role = role.lower().replace(" ", "-")
    
    # 1. AmbitionBox India Strategy
    ambitionbox_url = f"https://www.ambitionbox.com/salaries/{formatted_role}-salaries"
    
    # 2. Glassdoor India Strategy
    glassdoor_url = f"https://www.glassdoor.co.in/Salaries/{formatted_role}-salary-SRCH_KO0,{len(role)}.htm"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1"
    }

    print(f"Scraping salary data for role: {role}")
    
    try:
        # Try AmbitionBox
        response = requests.get(ambitionbox_url, headers=headers, timeout=10)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, "html.parser")
            # Extract text from potential salary blocks
            text_blocks = soup.get_text(separator=' ', strip=True)
            # Find snippets containing "Lakhs", "LPA", or "₹" near the role name
            matches = re.findall(r'.{0,50}(?:Lakhs|LPA|₹\s*[\d,]+).{0,50}', text_blocks, re.IGNORECASE)
            if matches:
                context_data.append(f"AmbitionBox Data for {role}: " + " | ".join(matches[:5]))
    except Exception as e:
        print(f"AmbitionBox scraping failed: {e}")

    try:
        # Try Glassdoor
        response = requests.get(glassdoor_url, headers=headers, timeout=10)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, "html.parser")
            text_blocks = soup.get_text(separator=' ', strip=True)
            matches = re.findall(r'.{0,50}(?:Lakhs|LPA|₹\s*[\d,]+).{0,50}', text_blocks, re.IGNORECASE)
            if matches:
                context_data.append(f"Glassdoor Data for {role}: " + " | ".join(matches[:5]))
    except Exception as e:
        print(f"Glassdoor scraping failed: {e}")

    # Combine results
    final_context = "\\n".join(context_data)
    
    if not final_context:
        # Fallback message indicating the LLM should rely on its own knowledge
        final_context = "Live scraping was blocked. Please rely on your extensive pre-trained knowledge base for accurate, current Indian IT market salary rates for this role."
        
    return final_context

if __name__ == "__main__":
    # Test the scraper
    print(scrape_salary_data("Software Engineer"))
