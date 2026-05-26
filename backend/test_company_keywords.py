#!/usr/bin/env python3
"""
Test script for company-specific keywords feature.
Tests that the RAG pipeline correctly identifies and uses company keywords.
"""

import requests
import json
from pprint import pprint

BASE_URL = "http://localhost:8000"


def test_amazon_analysis():
    """Test the /analyze endpoint with Amazon job description."""
    
    test_payload = {
        "resume_text": """
        Jane Developer
        
        EXPERIENCE:
        - 4 years software development at tech companies
        - Led cross-functional projects successfully
        - Delivered critical features on schedule
        - Mentored junior developers
        - Customer feedback integration in product decisions
        - Ownership of full project lifecycle
        
        SKILLS:
        Python, Java, AWS, DynamoDB, REST APIs, System Design
        """,
        "job_description": """
        Senior Software Engineer - Amazon Web Services
        
        Amazon is looking for a Senior Software Engineer to join our team.
        
        About the role:
        - Take ownership of critical AWS services
        - Show bias for action in fast-moving teams
        - Deep dive into complex technical problems
        - Customer obsession drives our decisions
        - Deliver results that matter
        
        Requirements:
        - 5+ years of software development
        - AWS experience
        - Python or Java expertise
        """
    }
    
    print("=" * 70)
    print("Testing Amazon JD - Company-Specific Keywords")
    print("=" * 70)
    print("\n📨 Sending request with Amazon job description...\n")
    
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
            
            if data.get("status") == "success":
                analysis = data.get("data", {})
                
                print("=" * 70)
                print("ANALYSIS RESULTS - AMAZON")
                print("=" * 70)
                print(f"\n🎯 ATS Score: {analysis.get('ats_score', 'N/A')}/100")
                
                print(f"\n📌 Company Keywords (Amazon-specific):")
                company_kws = analysis.get('company_keywords', [])
                for kw in company_kws:
                    print(f"   • {kw}")
                
                # Check if Amazon keywords are present
                expected_amazon_kws = ['ownership', 'customer obsession', 'bias for action', 'deliver results']
                print(f"\n🔍 Amazon Keywords Check:")
                for expected in expected_amazon_kws:
                    if any(expected.lower() in str(kw).lower() for kw in company_kws):
                        print(f"   ✅ '{expected}' found in suggestions")
                    else:
                        print(f"   ⚠️  '{expected}' not strongly emphasized (may vary)")
                
                print(f"\n📋 Missing Keywords:")
                missing = analysis.get('missing_keywords', [])
                for m in missing:
                    print(f"   • {m}")
                
                print(f"\n✨ Rewritten Bullets:")
                bullets = analysis.get('rewritten_bullets', [])
                for i, bullet in enumerate(bullets, 1):
                    print(f"   {i}. {bullet}")
                
                print(f"\n🎯 Top Matches:")
                matches = analysis.get('top_matches', [])
                for match in matches:
                    print(f"   • {match}")
                
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


def test_google_analysis():
    """Test with Google job description."""
    
    test_payload = {
        "resume_text": """
        Alex Engineer
        
        EXPERIENCE:
        - 6 years at scale-up companies
        - Data-driven decision making
        - Worked on systems with millions of users
        - Comfortable with ambiguity and rapid changes
        - Analytics and metrics-focused
        
        SKILLS:
        Python, Go, BigQuery, Machine Learning, Kubernetes
        """,
        "job_description": """
        Software Engineer - Google
        
        Join Google's engineering team!
        
        We need someone who:
        - Thinks about scalability from the start
        - Makes data-driven decisions
        - Can handle ambiguity in technical challenges
        - Wants to create impact at scale
        
        Requirements:
        - 5+ years experience
        - Strong fundamentals
        - Python or Go experience
        """
    }
    
    print("\n" + "=" * 70)
    print("Testing Google JD - Company-Specific Keywords")
    print("=" * 70)
    print("\n📨 Sending request with Google job description...\n")
    
    try:
        response = requests.post(
            f"{BASE_URL}/analyze",
            json=test_payload,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("status") == "success":
                analysis = data.get("data", {})
                
                print(f"🎯 ATS Score: {analysis.get('ats_score', 'N/A')}/100")
                
                print(f"\n📌 Company Keywords (Google-specific):")
                company_kws = analysis.get('company_keywords', [])
                for kw in company_kws:
                    print(f"   • {kw}")
                
                expected_google_kws = ['scalability', 'data-driven', 'impact at scale', 'ambiguity']
                print(f"\n🔍 Google Keywords Check:")
                for expected in expected_google_kws:
                    if any(expected.lower() in str(kw).lower() for kw in company_kws):
                        print(f"   ✅ '{expected}' found in suggestions")
                    else:
                        print(f"   ⚠️  '{expected}' not strongly emphasized")
                
            else:
                print(f"❌ Error: {data.get('message')}")
        else:
            print(f"❌ Request failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")


def test_default_keywords():
    """Test with a generic job description (no company match)."""
    
    test_payload = {
        "resume_text": """
        Pat Developer
        
        EXPERIENCE:
        - 3 years software development
        - Problem solving on various projects
        - Collaborated with teams
        """,
        "job_description": """
        Software Developer Role
        
        We need a developer who can:
        - Solve complex problems
        - Work in a team
        - Show leadership
        - Make impact in their role
        """
    }
    
    print("\n" + "=" * 70)
    print("Testing Generic JD - Default Keywords")
    print("=" * 70)
    print("\n📨 Sending request with generic job description...\n")
    
    try:
        response = requests.post(
            f"{BASE_URL}/analyze",
            json=test_payload,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("status") == "success":
                analysis = data.get("data", {})
                
                print(f"🎯 ATS Score: {analysis.get('ats_score', 'N/A')}/100")
                
                print(f"\n📌 Company Keywords (Default):")
                company_kws = analysis.get('company_keywords', [])
                for kw in company_kws:
                    print(f"   • {kw}")
                
                print(f"\n🔍 Default Keywords Check:")
                default_kws = ['leadership', 'collaboration', 'problem-solving', 'impact']
                for default in default_kws:
                    if any(default.lower() in str(kw).lower() for kw in company_kws):
                        print(f"   ✅ '{default}' found")
                    else:
                        print(f"   ⚠️  '{default}' not strongly emphasized")
                
            else:
                print(f"❌ Error: {data.get('message')}")
        else:
            print(f"❌ Request failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")


if __name__ == "__main__":
    print("\n🚀 Company-Specific Keywords Test Suite\n")
    
    # Test Amazon
    test_amazon_analysis()
    
    # Test Google
    test_google_analysis()
    
    # Test Default
    test_default_keywords()
    
    print("\n" + "=" * 70)
    print("Test suite complete!")
    print("=" * 70 + "\n")
