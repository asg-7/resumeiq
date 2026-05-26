#!/usr/bin/env python3
import requests
import json
from pprint import pprint

BASE_URL = "http://127.0.0.1:8000"

def test_salary_endpoint():
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
        
        EDUCATION:
        - B.Tech in Computer Science, IIT Bombay (Tier 1 College)
        
        SKILLS:
        Python, JavaScript, FastAPI, Django, PostgreSQL, MongoDB, Docker, AWS, REST APIs
        """
    }
    
    print("=" * 60)
    print("Testing /predict-salary endpoint...")
    print("=" * 60)
    
    try:
        response = requests.post(
            f"{BASE_URL}/predict-salary",
            json=test_payload,
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}\n")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Response received successfully!\n")
            pprint(data)
        else:
            print(f"❌ Request failed with status {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Cannot connect to server at", BASE_URL)
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    test_salary_endpoint()
