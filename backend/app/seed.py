"""Database seeder — populates demo data matching the frontend mock data."""

import asyncio
import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.core.security import hash_password
from app.database import async_session_factory
from app.modules.auth.models import Organization, User
from app.modules.companies.models import Company
from app.modules.contacts.models import Contact
from app.modules.deals.models import Deal
from app.modules.pipelines.models import Pipeline, PipelineStage
from app.modules.activities.models import Activity
from app.modules.notifications.models import Notification


def _random_date(days_back: int = 90) -> datetime:
    """Generate a random datetime. Positive = past, negative = future."""
    if days_back >= 0:
        offset = random.randint(0, max(days_back, 1))
        return datetime.now(timezone.utc) - timedelta(days=offset, hours=random.randint(0, 23))
    else:
        offset = random.randint(0, abs(days_back))
        return datetime.now(timezone.utc) + timedelta(days=offset, hours=random.randint(0, 23))


async def seed():
    """Seed the database with demo data."""
    async with async_session_factory() as session:
        # Check if already seeded
        result = await session.execute(select(Organization).limit(1))
        if result.scalar_one_or_none():
            print("⚠ Database already seeded — skipping")
            return

        print("🌱 Seeding database...")

        # --- 1. Organization ---
        org = Organization(
            name="Acme Corp",
            slug="acme-corp",
            plan="professional",
            settings={"currency": "USD", "timezone": "America/New_York"},
        )
        session.add(org)
        await session.flush()
        org_id = org.id
        print(f"  ✓ Organization: {org.name} ({org_id})")

        # --- 2. Users ---
        users_data = [
            {"first_name": "Badal", "last_name": "Sharma", "email": "badal@acme.com", "role": "admin"},
            {"first_name": "Sarah", "last_name": "Johnson", "email": "sarah@acme.com", "role": "manager"},
            {"first_name": "Mike", "last_name": "Chen", "email": "mike@acme.com", "role": "sales_rep"},
            {"first_name": "Emily", "last_name": "Davis", "email": "emily@acme.com", "role": "sales_rep"},
            {"first_name": "James", "last_name": "Wilson", "email": "james@acme.com", "role": "viewer"},
        ]
        users = []
        for u in users_data:
            user = User(
                first_name=u["first_name"],
                last_name=u["last_name"],
                email=u["email"],
                password_hash=hash_password("password123"),
                role=u["role"],
                organization_id=org_id,
            )
            session.add(user)
            users.append(user)
        await session.flush()
        print(f"  ✓ Users: {len(users)} (login: badal@acme.com / password123)")

        # --- 3. Companies ---
        companies_data = [
            {"name": "TechVista Solutions", "domain": "techvista.com", "industry": "Technology", "employee_count": "51-200", "annual_revenue": 5000000},
            {"name": "Global Finance Corp", "domain": "globalfinance.com", "industry": "Finance", "employee_count": "201-1000", "annual_revenue": 50000000},
            {"name": "HealthFirst Medical", "domain": "healthfirst.com", "industry": "Healthcare", "employee_count": "201-1000", "annual_revenue": 25000000},
            {"name": "GreenLeaf Energy", "domain": "greenleaf.com", "industry": "Energy", "employee_count": "11-50", "annual_revenue": 2000000},
            {"name": "Urban Design Co", "domain": "urbandesign.co", "industry": "Real Estate", "employee_count": "11-50", "annual_revenue": 3000000},
            {"name": "DataStream Analytics", "domain": "datastream.io", "industry": "Technology", "employee_count": "51-200", "annual_revenue": 8000000},
            {"name": "Atlas Manufacturing", "domain": "atlasmfg.com", "industry": "Manufacturing", "employee_count": "1001+", "annual_revenue": 100000000},
            {"name": "Bright Education", "domain": "brightedu.org", "industry": "Education", "employee_count": "51-200", "annual_revenue": 4000000},
            {"name": "Swift Logistics", "domain": "swiftlog.com", "industry": "Logistics", "employee_count": "201-1000", "annual_revenue": 15000000},
            {"name": "MediaPulse Agency", "domain": "mediapulse.com", "industry": "Media", "employee_count": "11-50", "annual_revenue": 1500000},
            {"name": "CloudNine Hosting", "domain": "cloudnine.io", "industry": "Technology", "employee_count": "11-50", "annual_revenue": 3500000},
            {"name": "FreshBite Foods", "domain": "freshbite.com", "industry": "Food & Beverage", "employee_count": "51-200", "annual_revenue": 7000000},
            {"name": "SecureVault Inc", "domain": "securevault.com", "industry": "Cybersecurity", "employee_count": "51-200", "annual_revenue": 12000000},
            {"name": "Pinnacle Consulting", "domain": "pinnacle.co", "industry": "Consulting", "employee_count": "11-50", "annual_revenue": 2500000},
            {"name": "OceanView Resorts", "domain": "oceanview.com", "industry": "Hospitality", "employee_count": "201-1000", "annual_revenue": 20000000},
        ]
        companies = []
        for c in companies_data:
            company = Company(
                name=c["name"],
                domain=c["domain"],
                industry=c["industry"],
                employee_count=c["employee_count"],
                annual_revenue=c["annual_revenue"],
                phone=f"+1-555-{random.randint(100, 999)}-{random.randint(1000, 9999)}",
                website=f"https://{c['domain']}",
                owner_id=random.choice(users[:4]).id,
                tags=[c["industry"].lower(), "prospect"],
                address={
                    "street": f"{random.randint(100,999)} Main St",
                    "city": random.choice(["New York", "San Francisco", "Austin", "Chicago", "Boston"]),
                    "state": random.choice(["NY", "CA", "TX", "IL", "MA"]),
                    "zip": f"{random.randint(10000,99999)}",
                    "country": "US",
                },
                organization_id=org_id,
            )
            session.add(company)
            companies.append(company)
        await session.flush()
        print(f"  ✓ Companies: {len(companies)}")

        # --- 4. Contacts ---
        first_names = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Quinn", "Avery", "Reese", "Dakota",
                       "Cameron", "Skyler", "Finley", "Rowan", "Harper", "Blake", "Drew", "Sage", "Parker", "Logan",
                       "Hayden", "Emery", "Peyton", "Kai", "Charlie", "Jamie", "Jesse", "Robin", "Phoenix", "Shawn"]
        last_names = ["Anderson", "Martinez", "Thompson", "Garcia", "Lee", "Robinson", "Clark", "Lewis", "Hall", "Young",
                      "Walker", "Wright", "King", "Scott", "Adams", "Baker", "Nelson", "Carter", "Mitchell", "Perez",
                      "Roberts", "Turner", "Phillips", "Campbell", "Parker", "Evans", "Edwards", "Collins", "Stewart", "Morris"]
        titles = ["CEO", "CTO", "VP Sales", "Director of Engineering", "Product Manager", "CFO", "Head of Marketing",
                  "Operations Manager", "Business Development Manager", "Account Executive"]
        statuses = ["active", "lead", "prospect", "customer"]
        sources = ["website", "referral", "linkedin", "cold_call", "event"]

        contacts = []
        for i in range(30):
            company = random.choice(companies)
            contact = Contact(
                first_name=random.choice(first_names),
                last_name=random.choice(last_names),
                email=f"contact{i+1}@{company.domain}",
                phone=f"+1-555-{random.randint(100,999)}-{random.randint(1000,9999)}",
                title=random.choice(titles),
                company_id=company.id,
                status=random.choice(statuses),
                source=random.choice(sources),
                owner_id=random.choice(users[:4]).id,
                tags=random.sample(["vip", "decision-maker", "technical", "executive", "new-lead"], k=random.randint(1, 3)),
                last_contacted_at=_random_date(30),
                organization_id=org_id,
            )
            session.add(contact)
            contacts.append(contact)
        await session.flush()
        print(f"  ✓ Contacts: {len(contacts)}")

        # --- 5. Pipeline + Stages ---
        pipeline = Pipeline(name="Sales Pipeline", is_default=True, organization_id=org_id)
        session.add(pipeline)
        await session.flush()

        stages_data = [
            {"name": "Lead", "order": 0, "probability": 10, "color": "#6b7280"},
            {"name": "Qualified", "order": 1, "probability": 25, "color": "#3b82f6"},
            {"name": "Proposal", "order": 2, "probability": 50, "color": "#8b5cf6"},
            {"name": "Negotiation", "order": 3, "probability": 75, "color": "#f59e0b"},
            {"name": "Closed Won", "order": 4, "probability": 100, "color": "#10b981"},
            {"name": "Closed Lost", "order": 5, "probability": 0, "color": "#ef4444"},
        ]
        stages = []
        for s in stages_data:
            stage = PipelineStage(
                pipeline_id=pipeline.id,
                name=s["name"],
                order=s["order"],
                probability=s["probability"],
                color=s["color"],
            )
            session.add(stage)
            stages.append(stage)
        await session.flush()
        print(f"  ✓ Pipeline: {pipeline.name} with {len(stages)} stages")

        # --- 6. Deals ---
        deal_titles = [
            "Enterprise License Deal", "Annual Support Contract", "Cloud Migration Project",
            "Security Audit Package", "Custom Integration", "Staff Augmentation",
            "Platform Upgrade", "Data Analytics Suite", "Mobile App Development",
            "Consulting Engagement", "Hardware Procurement", "Training Program",
            "API Development", "Digital Transformation", "Infrastructure Modernization",
            "SaaS Implementation", "Network Security Upgrade", "CRM Integration",
            "ERP System", "Marketing Automation", "DevOps Pipeline Setup",
            "AI/ML Pilot Project", "Compliance Audit", "Website Redesign",
        ]
        deals = []
        open_stages = stages[:4]  # Lead, Qualified, Proposal, Negotiation
        for i, title in enumerate(deal_titles):
            contact = random.choice(contacts)
            is_closed = random.random() < 0.25
            if is_closed:
                stage = random.choice(stages[4:])  # Won or Lost
                deal_status = "won" if stage.name == "Closed Won" else "lost"
            else:
                stage = random.choice(open_stages)
                deal_status = "open"

            deal = Deal(
                title=title,
                value=random.choice([5000, 10000, 25000, 50000, 75000, 100000, 150000, 250000]),
                currency="USD",
                pipeline_id=pipeline.id,
                stage_id=stage.id,
                probability=stage.probability,
                expected_close_date=(datetime.now(timezone.utc) + timedelta(days=random.randint(7, 120))).date(),
                status=deal_status,
                contact_id=contact.id,
                company_id=contact.company_id,
                owner_id=random.choice(users[:4]).id,
                tags=random.sample(["enterprise", "mid-market", "startup", "renewal", "upsell"], k=random.randint(1, 2)),
                organization_id=org_id,
            )
            if deal_status == "lost":
                deal.lost_reason = random.choice(["Budget constraints", "Chose competitor", "Project postponed", "No response"])
            if deal_status != "open":
                deal.actual_close_date = (datetime.now(timezone.utc) - timedelta(days=random.randint(1, 30))).date()
            session.add(deal)
            deals.append(deal)
        await session.flush()
        print(f"  ✓ Deals: {len(deals)}")

        # --- 7. Activities ---
        activity_types = ["call", "email", "meeting", "task"]
        activity_subjects = [
            "Follow-up call", "Product demo", "Quarterly review", "Contract discussion",
            "Technical requirements", "Budget review", "Onboarding session",
            "Check-in call", "Send proposal", "Schedule meeting", "Review feedback",
            "Negotiate terms", "Send invoice", "Plan implementation", "Training session",
        ]
        activities = []
        for i in range(50):
            contact = random.choice(contacts)
            is_completed = random.random() < 0.4
            a_type = random.choice(activity_types)
            activity = Activity(
                type=a_type,
                subject=random.choice(activity_subjects),
                description=f"Auto-generated activity #{i+1}",
                priority=random.choice(["low", "medium", "high"]),
                due_date=_random_date(-30),  # some in future
                is_completed=is_completed,
                completed_at=_random_date(10) if is_completed else None,
                contact_id=contact.id,
                company_id=contact.company_id,
                deal_id=random.choice(deals).id if random.random() < 0.5 else None,
                owner_id=random.choice(users[:4]).id,
                duration=random.choice([15, 30, 45, 60, 90]) if a_type in ("call", "meeting") else None,
                organization_id=org_id,
            )
            session.add(activity)
            activities.append(activity)
        await session.flush()
        print(f"  ✓ Activities: {len(activities)}")

        # --- 8. Notifications ---
        notif_templates = [
            ("New deal assigned", "You've been assigned to {deal}", "info"),
            ("Deal won!", "{deal} has been marked as won", "success"),
            ("Overdue task", "Task '{activity}' is past due", "warning"),
            ("New contact added", "{contact} was added to your pipeline", "info"),
        ]
        for user in users[:3]:
            for _ in range(3):
                tmpl = random.choice(notif_templates)
                notif = Notification(
                    user_id=user.id,
                    title=tmpl[0],
                    message=tmpl[1].format(
                        deal=random.choice(deal_titles),
                        activity=random.choice(activity_subjects),
                        contact="John Doe",
                    ),
                    type=tmpl[2],
                    read=random.random() < 0.3,
                    link=f"/deals/{random.choice(deals).id}" if random.random() < 0.5 else None,
                    organization_id=org_id,
                )
                session.add(notif)
        await session.flush()
        print("  ✓ Notifications: 9")

        await session.commit()
        print("\n✅ Database seeded successfully!")
        print(f"   Login: badal@acme.com / password123")
        print(f"   Org: {org.name} (ID: {org_id})")


if __name__ == "__main__":
    asyncio.run(seed())
