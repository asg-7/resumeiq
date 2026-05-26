#!/usr/bin/env python3
"""
Test script for the RAG pipeline endpoint.
Run this script to test the /analyze endpoint without Postman.
"""

import requests
import json
from pprint import pprint

BASE_URL = "http://127.0.0.1:8000"

def test_analyze_endpoint():
    """Test the /analyze endpoint with sample data."""
    
    test_payload = {
        "resume_text": """
        John Smith
        
        EXPERIENCE:
        - 5 years Python development with FastAPI and Django
        - REST API design and implementation  
        - Database optimization with PostgreSQL
        - AWS EC2 and S3 deployment experience
        - Docker containerization and image optimization
        - SQL and NoSQL database design
        
        SKILLS:
        Python, JavaScript, FastAPI, Django, PostgreSQL, MongoDB, Docker, AWS, REST APIs
        """,
        "job_description": """
        Senior Python Developer - 5+ years required
        
        Required:
        - FastAPI or Django experience
        - PostgreSQL optimization
        - Docker and containerization
        - AWS cloud services
        - REST API design
        
        Nice to have:
        - Kubernetes experience
        - React knowledge
        - Redis caching
        """
    }
    
    print("=" * 60)
    print("Testing /analyze endpoint...")
    print("=" * 60)
    print("\n📨 Sending request to POST /analyze\n")
    
    try:
        response = requests.post(
            f"{BASE_URL}/analyze",
            json=test_payload,
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}\n")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Response received successfully!\n")
            print("Response structure:")
            pprint(data)
            
            if data.get("status") == "success":
                analysis = data.get("data", {})
                print("\n" + "=" * 60)
                print("ANALYSIS RESULTS")
                print("=" * 60)
                print(f"ATS Score: {analysis.get('ats_score', 'N/A')}/100")
                print(f"\nMissing Keywords: {analysis.get('missing_keywords', [])}")
                print(f"\nTop Matches: {analysis.get('top_matches', [])}")
                print(f"\nCompany Keywords: {analysis.get('company_keywords', [])}")
                print(f"\nRewritten Bullets: {analysis.get('rewritten_bullets', [])}")
            else:
                print(f"❌ Error: {data.get('message', 'Unknown error')}")
        else:
            print(f"❌ Request failed with status {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Cannot connect to server at", BASE_URL)
        print("   Make sure the backend server is running:")
        print("   python -m uvicorn main:app --reload")
    except Exception as e:
        print(f"❌ Error: {str(e)}")


def test_root_endpoint():
    """Test the root endpoint to verify server is running."""
    print("\n" + "=" * 60)
    print("Testing root endpoint...")
    print("=" * 60)
    
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            print("✅ Server is running!")
            print(f"Response: {response.json()}")
        else:
            print(f"❌ Server returned status {response.status_code}")
    except Exception as e:
        print(f"❌ Cannot reach server: {str(e)}")


if __name__ == "__main__":
    print("\n🚀 ResumeIQ RAG Pipeline Test\n")
    
    # First check if server is running
    test_root_endpoint()
    
    # Then test the analyze endpoint
    test_analyze_endpoint()
    
    print("\n" + "=" * 60)
    print("Test complete!")
    print("=" * 60 + "\n")
