#!/usr/bin/env python3
import requests
import json
from pprint import pprint

BASE_URL = "http://127.0.0.1:8000"

resumes = {
    "fresher": """
    Jane Doe
    Recent Computer Science Graduate
    Education: B.Tech in Computer Science, XYZ University, 2024
    Skills: Python, HTML, CSS, JavaScript, Basic SQL
    Experience: 
    - 2 months internship at Tech Corp doing basic web dev.
    Projects: 
    - Personal blog using React.
    """,
    "senior": """
    Alice Smith
    Senior Cloud Architect
    Education: MS in Computer Science
    Experience: 
    - 8 years as Cloud Architect at Amazon AWS
    - Designed scalable microservices using Kubernetes, AWS Lambda, DynamoDB.
    - Led a team of 15 engineers.
    Skills: AWS, Kubernetes, Python, Go, System Architecture, Leadership
    """,
    "non_indian": """
    Bob Johnson
    Software Engineer based in New York, USA.
    Education: BS Computer Science, NYU
    Experience: 
    - 4 years at Google NY as SWE
    - Developed backend services in C++ and Java.
    Skills: C++, Java, Distributed Systems
    """
}

def test_variants():
    for name, text in resumes.items():
        print(f"\\n{'='*40}\\nTesting {name} resume...\\n{'='*40}")
        try:
            response = requests.post(f"{BASE_URL}/predict-salary", json={"resume_text": text}, timeout=30)
            if response.status_code == 200:
                data = response.json()
                print(f"Role: {data.get('extracted_role')}")
                print(f"Experience: {data.get('years_of_experience')} Yrs")
                print(f"Salary: {data.get('min_salary_lpa')} - {data.get('median_salary_lpa')} - {data.get('max_salary_lpa')} LPA")
                print(f"Confidence: {data.get('confidence')}")
                print(f"Reasoning: {data.get('reasoning')}")
            else:
                print(f"Failed: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    test_variants()
