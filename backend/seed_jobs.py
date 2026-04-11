"""
Seed 10 dummy job listings for testing the job board.
Run: python3 seed_jobs.py
"""
import os
import json
import urllib.request
from dotenv import load_dotenv

load_dotenv()

JOBS = [
    {
        "external_id": "demo:001",
        "source": "linkedin",
        "title": "UX Designer",
        "company": "Agoda",
        "company_logo": None,
        "location": "Bangkok, Thailand",
        "location_type": "hybrid",
        "salary_label": "฿60,000–฿90,000",
        "salary_min": 60000,
        "salary_max": 90000,
        "salary_currency": "THB",
        "url": "https://careers.agoda.com",
        "description": "We're looking for a talented UX Designer to join our product team in Bangkok.\n\nYou will work closely with product managers and engineers to design intuitive experiences for millions of travellers worldwide.\n\nResponsibilities:\n• Lead end-to-end design for key product features\n• Conduct user research and usability testing\n• Create wireframes, prototypes, and high-fidelity mockups\n• Collaborate with cross-functional teams\n\nRequirements:\n• 3+ years of UX/product design experience\n• Strong portfolio demonstrating user-centred design\n• Proficiency in Figma\n• Experience working in an Agile environment",
        "career_path": "UX Design",
        "tags": ["figma", "ux-research", "product-design"],
        "is_active": True,
    },
    {
        "external_id": "demo:002",
        "source": "seek",
        "title": "Data Analyst",
        "company": "SCB (Siam Commercial Bank)",
        "company_logo": None,
        "location": "Bangkok, Thailand",
        "location_type": "onsite",
        "salary_label": "฿50,000–฿75,000",
        "salary_min": 50000,
        "salary_max": 75000,
        "salary_currency": "THB",
        "url": "https://www.scb.co.th/en/about-us/careers.html",
        "description": "Join SCB's data team and help drive data-driven decisions across the bank.\n\nYou will analyse large datasets to uncover insights that improve customer experience and business performance.\n\nResponsibilities:\n• Analyse complex data sets using SQL and Python\n• Build dashboards and reports in Power BI\n• Work with business stakeholders to define metrics\n• Present findings to senior management\n\nRequirements:\n• Bachelor's degree in Statistics, Computer Science, or related field\n• 2+ years of experience in data analysis\n• Strong SQL skills\n• Experience with Python (Pandas, NumPy)\n• Good communication skills in Thai and English",
        "career_path": "Data Analysis",
        "tags": ["sql", "python", "power-bi", "analytics"],
        "is_active": True,
    },
    {
        "external_id": "demo:003",
        "source": "linkedin",
        "title": "Digital Marketing Manager",
        "company": "Central Group",
        "company_logo": None,
        "location": "Bangkok, Thailand",
        "location_type": "hybrid",
        "salary_label": "฿70,000–฿100,000",
        "salary_min": 70000,
        "salary_max": 100000,
        "salary_currency": "THB",
        "url": "https://www.central.co.th/en/career",
        "description": "Central Group is seeking an experienced Digital Marketing Manager to lead our online marketing strategy.\n\nYou will oversee all digital channels including social media, SEO/SEM, email marketing, and performance advertising.\n\nResponsibilities:\n• Develop and execute digital marketing strategies\n• Manage a team of 4–6 marketing specialists\n• Oversee paid media budgets (Google Ads, Meta Ads)\n• Drive SEO strategy and content marketing\n• Track KPIs and report performance to leadership\n\nRequirements:\n• 5+ years of digital marketing experience\n• Experience managing large advertising budgets\n• Strong analytical and data skills\n• Fluent in Thai and English",
        "career_path": "Digital Marketing",
        "tags": ["seo", "sem", "social-media", "google-ads"],
        "is_active": True,
    },
    {
        "external_id": "demo:004",
        "source": "seek",
        "title": "Full Stack Developer",
        "company": "Omise",
        "company_logo": None,
        "location": "Bangkok, Thailand",
        "location_type": "remote",
        "salary_label": "฿80,000–฿120,000",
        "salary_min": 80000,
        "salary_max": 120000,
        "salary_currency": "THB",
        "url": "https://www.omise.co/careers",
        "description": "Omise is Thailand's leading payment technology company. We're hiring Full Stack Developers to build the future of payments.\n\nYou'll work on high-traffic, mission-critical systems processing millions of transactions.\n\nResponsibilities:\n• Build and maintain RESTful APIs and microservices\n• Develop frontend features in React or Next.js\n• Write clean, well-tested code\n• Participate in code reviews and architecture discussions\n\nRequirements:\n• 3+ years of full-stack development experience\n• Proficiency in Node.js or Python backend\n• Strong React/Next.js frontend skills\n• Experience with PostgreSQL and Redis\n• Comfortable with Docker and CI/CD pipelines",
        "career_path": "Full-Stack Web",
        "tags": ["react", "nodejs", "postgresql", "docker"],
        "is_active": True,
    },
    {
        "external_id": "demo:005",
        "source": "linkedin",
        "title": "Senior UX/UI Designer",
        "company": "Grab Thailand",
        "company_logo": None,
        "location": "Bangkok, Thailand",
        "location_type": "hybrid",
        "salary_label": "฿90,000–฿130,000",
        "salary_min": 90000,
        "salary_max": 130000,
        "salary_currency": "THB",
        "url": "https://grab.careers",
        "description": "Grab is looking for a Senior UX/UI Designer to shape the experience for millions of users across Southeast Asia.\n\nResponsibilities:\n• Own the design of key user journeys from discovery to delivery\n• Mentor junior designers and contribute to design system\n• Run workshops and design sprints with stakeholders\n• Champion accessibility and inclusive design\n\nRequirements:\n• 5+ years of product design experience\n• Excellent portfolio demonstrating impact\n• Expert-level Figma skills\n• Experience with design systems\n• Strong stakeholder management skills",
        "career_path": "UX Design",
        "tags": ["figma", "design-systems", "ux", "ui"],
        "is_active": True,
    },
    {
        "external_id": "demo:006",
        "source": "seek",
        "title": "Sales Executive",
        "company": "Lazada Thailand",
        "company_logo": None,
        "location": "Bangkok, Thailand",
        "location_type": "onsite",
        "salary_label": "฿35,000–฿55,000 + commission",
        "salary_min": 35000,
        "salary_max": 55000,
        "salary_currency": "THB",
        "url": "https://careers.lazada.com",
        "description": "Join Lazada's commercial team and help grow our seller ecosystem in Thailand.\n\nYou will be responsible for acquiring new brand partners and growing revenue from existing sellers.\n\nResponsibilities:\n• Identify and acquire new brand and merchant partners\n• Manage a portfolio of key seller accounts\n• Negotiate commercial terms and contracts\n• Collaborate with marketing and operations teams\n\nRequirements:\n• 2+ years of B2B sales experience\n• Strong negotiation and communication skills\n• Experience in e-commerce is a plus\n• Fluent Thai; conversational English",
        "career_path": "Sales",
        "tags": ["b2b-sales", "account-management", "e-commerce"],
        "is_active": True,
    },
    {
        "external_id": "demo:007",
        "source": "linkedin",
        "title": "Graphic Designer",
        "company": "True Corporation",
        "company_logo": None,
        "location": "Bangkok, Thailand",
        "location_type": "onsite",
        "salary_label": "฿30,000–฿45,000",
        "salary_min": 30000,
        "salary_max": 45000,
        "salary_currency": "THB",
        "url": "https://www.true.th/careers",
        "description": "True Corporation is looking for a creative Graphic Designer to produce compelling visual content across digital and print channels.\n\nResponsibilities:\n• Design marketing materials for campaigns (digital, print, OOH)\n• Create social media visuals and motion graphics\n• Maintain brand consistency across all touchpoints\n• Collaborate with marketing and brand teams\n\nRequirements:\n• 2+ years of graphic design experience\n• Proficiency in Adobe Creative Suite (Photoshop, Illustrator, After Effects)\n• Strong visual sensibility and attention to detail\n• Portfolio showcasing diverse design work",
        "career_path": "Graphic Design",
        "tags": ["adobe", "photoshop", "illustrator", "motion-graphics"],
        "is_active": True,
    },
    {
        "external_id": "demo:008",
        "source": "seek",
        "title": "Business Intelligence Analyst",
        "company": "Kasikorn Bank (KBank)",
        "company_logo": None,
        "location": "Bangkok, Thailand",
        "location_type": "hybrid",
        "salary_label": "฿55,000–฿80,000",
        "salary_min": 55000,
        "salary_max": 80000,
        "salary_currency": "THB",
        "url": "https://kbank.co.th/about/careers",
        "description": "KBank's analytics team is growing. We're looking for a BI Analyst to help translate data into actionable business intelligence.\n\nResponsibilities:\n• Design and maintain BI dashboards (Tableau/Power BI)\n• Work with data engineers to model and document data\n• Support business teams with ad-hoc analysis\n• Define and track key business metrics\n\nRequirements:\n• 3+ years of BI or data analytics experience\n• Expert SQL skills\n• Tableau or Power BI certification preferred\n• Experience in financial services is a plus",
        "career_path": "Data Analysis",
        "tags": ["tableau", "power-bi", "sql", "bi"],
        "is_active": True,
    },
    {
        "external_id": "demo:009",
        "source": "linkedin",
        "title": "React Native Developer",
        "company": "Line Thailand",
        "company_logo": None,
        "location": "Bangkok, Thailand",
        "location_type": "hybrid",
        "salary_label": "฿70,000–฿110,000",
        "salary_min": 70000,
        "salary_max": 110000,
        "salary_currency": "THB",
        "url": "https://linecorp.com/th/career",
        "description": "Line Thailand is hiring a React Native Developer to build features for our super-app used by 50M+ Thai users.\n\nResponsibilities:\n• Develop new features for the Line mobile app (iOS & Android)\n• Optimise app performance and reduce load times\n• Work closely with backend engineers on API integration\n• Write unit and integration tests\n\nRequirements:\n• 3+ years of React Native experience\n• Solid understanding of iOS and Android platforms\n• Experience with Redux or similar state management\n• Familiarity with CI/CD and app store deployment",
        "career_path": "Full-Stack Web",
        "tags": ["react-native", "ios", "android", "redux"],
        "is_active": True,
    },
    {
        "external_id": "demo:010",
        "source": "seek",
        "title": "Brand & Content Designer",
        "company": "Shopee Thailand",
        "company_logo": None,
        "location": "Bangkok, Thailand",
        "location_type": "onsite",
        "salary_label": "฿40,000–฿60,000",
        "salary_min": 40000,
        "salary_max": 60000,
        "salary_currency": "THB",
        "url": "https://careers.shopee.co.th",
        "description": "Shopee Thailand is looking for a Brand & Content Designer to create scroll-stopping visuals for Thailand's #1 e-commerce platform.\n\nResponsibilities:\n• Design campaign visuals for key shopping events (11.11, 12.12)\n• Produce static and animated content for social media\n• Work with copywriters and marketing leads on concept development\n• Ensure visual consistency with Shopee's global brand guidelines\n\nRequirements:\n• 2+ years of design experience in a commercial environment\n• Strong skills in Adobe Illustrator, Photoshop, and After Effects\n• Experience designing for social media platforms\n• A portfolio that demonstrates creative flair and brand awareness",
        "career_path": "Graphic Design",
        "tags": ["branding", "content-design", "social-media", "adobe"],
        "is_active": True,
    },
]


def supabase_upsert(url: str, service_key: str, table: str, rows: list):
    endpoint = f"{url}/rest/v1/{table}"
    data = json.dumps(rows).encode()
    req = urllib.request.Request(
        endpoint,
        data=data,
        method="POST",
        headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=representation",
        },
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def main():
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

    result = supabase_upsert(url, key, "job_listings", JOBS)
    for r in result:
        print(f"  ✓ {r['title']} @ {r['company']}")
    print(f"\n✅ Done — {len(result)} upserted.")


if __name__ == "__main__":
    main()
