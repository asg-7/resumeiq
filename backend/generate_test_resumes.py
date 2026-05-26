import fitz
import os

def create_resume_pdf(filename, name, title, profile_summary, experience_list, skills_list):
    doc = fitz.open()
    page = doc.new_page()
    
    # Define text layout
    y_offset = 50
    
    # Draw Name
    page.insert_text((50, y_offset), name, fontsize=20, fontname="hebo")
    y_offset += 25
    
    # Draw Title
    page.insert_text((50, y_offset), title, fontsize=14, fontname="hebo", color=(0.4, 0.4, 0.4))
    y_offset += 35
    
    # Draw Profile Summary
    page.insert_text((50, y_offset), "PROFILE SUMMARY", fontsize=12, fontname="hebo")
    y_offset += 15
    rect_summary = fitz.Rect(50, y_offset, 550, y_offset + 50)
    page.insert_textbox(rect_summary, profile_summary, fontsize=10, fontname="helv")
    y_offset += 60
    
    # Draw Experience
    page.insert_text((50, y_offset), "PROFESSIONAL EXPERIENCE", fontsize=12, fontname="hebo")
    y_offset += 15
    
    for exp in experience_list:
        # Company and role
        role_text = f"{exp['role']} - {exp['company']} ({exp['duration']})"
        page.insert_text((50, y_offset), role_text, fontsize=10, fontname="hebo")
        y_offset += 15
        
        # Bullets
        bullets_text = "\n".join([f"- {b}" for b in exp['bullets']])
        rect_exp = fitz.Rect(50, y_offset, 550, y_offset + 80)
        page.insert_textbox(rect_exp, bullets_text, fontsize=10, fontname="helv")
        y_offset += 90
        
    # Draw Skills
    page.insert_text((50, y_offset), "TECHNICAL SKILLS", fontsize=12, fontname="hebo")
    y_offset += 15
    skills_text = ", ".join(skills_list)
    rect_skills = fitz.Rect(50, y_offset, 550, y_offset + 30)
    page.insert_textbox(rect_skills, skills_text, fontsize=10, fontname="helv")
    
    # Save the document
    doc.save(filename)
    doc.close()
    print(f"Created PDF resume: {filename}")

if __name__ == "__main__":
    # Ensure target directory exists
    os.makedirs("test_resumes", exist_ok=True)
    
    # Resume 1: Software Engineer
    create_resume_pdf(
        "test_resumes/software_engineer_resume.pdf",
        "Alex Dev",
        "Senior Software Engineer",
        "Experienced software developer with 5+ years of expertise in designing and building scalable web applications, REST APIs, and microservices using Python and modern frameworks.",
        [
            {
                "role": "Senior Software Engineer",
                "company": "TechCorp Solutions",
                "duration": "2023 - Present",
                "bullets": [
                    "Led the design and development of high-performance backend microservices using Python and FastAPI, handling 10k+ requests daily.",
                    "Optimized PostgreSQL database schemas and complex queries, leading to a 40% reduction in API response times.",
                    "Designed and maintained CI/CD pipelines, containerizing applications with Docker and deploying to AWS ECS.",
                    "Mentored junior developers and introduced unit testing coverage goals, improving codebase stability."
                ]
            }
        ],
        ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS (ECS, RDS, S3)", "Git", "Redis", "REST APIs", "Unit Testing", "Microservices"]
    )
    
    # Resume 2: Data Analyst
    create_resume_pdf(
        "test_resumes/data_analyst_resume.pdf",
        "Sarah Metric",
        "Data Analyst",
        "Detail-oriented Data Analyst with 3+ years of experience interpreting data, building dashboards, and extracting actionable business insights to drive strategic decisions.",
        [
            {
                "role": "Data Analyst",
                "company": "AnalyticsCo",
                "duration": "2022 - Present",
                "bullets": [
                    "Wrote complex SQL queries in PostgreSQL and Snowflake to extract, clean, and format raw marketing and sales data.",
                    "Built and maintained interactive business dashboards in Tableau and Power BI, tracking weekly performance KPIs.",
                    "Performed exploratory data analysis (EDA) using Python, Pandas, and NumPy to identify user churn trends.",
                    "Presented weekly analytics reports to cross-functional marketing and sales leaders, optimizing campaign budgets."
                ]
            }
        ],
        ["SQL", "Python", "Pandas", "NumPy", "Tableau", "Power BI", "Excel", "PostgreSQL", "Data Visualization", "ETL", "KPI Reporting"]
    )
    
    # Resume 3: Product Manager
    create_resume_pdf(
        "test_resumes/product_manager_resume.pdf",
        "Jordan Lead",
        "Product Manager",
        "Results-driven Product Manager with 4+ years of experience defining product roadmaps, leading Agile teams, and launching customer-centric digital products.",
        [
            {
                "role": "Product Manager",
                "company": "GrowthInc",
                "duration": "2023 - Present",
                "bullets": [
                    "Owned and defined product roadmaps and strategic goals for core user onboarding, resulting in an 8% increase in conversion.",
                    "Collaborated with cross-functional engineering, design, and marketing teams in an Agile/Scrum environment.",
                    "Managed the product backlog, user stories, and feature prioritization using Jira.",
                    "Conducted qualitative user interviews and analyzed product usage analytics to define key product improvements."
                ]
            }
        ],
        ["Product Strategy", "Roadmap Planning", "Agile", "Scrum", "Jira", "User Research", "A/B Testing", "KPI Definition", "Cross-functional Leadership"]
    )
