import os
import django
from django.core.files.base import ContentFile

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User
from apps.business.models import Company, WhoWeAre, WhatWeDo, OurValues, CompanyService
from django.utils import timezone

def create_dummy_image(name):
    # Create a minimal SVG or use a placeholder bytes
    return ContentFile(b'<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="blue"/></svg>', name=name)

def run():
    print("Starting seed...")
    
    # Get Users
    admin_user = User.objects.filter(is_superuser=True).first()
    if not admin_user:
        admin_user = User.objects.filter(username__icontains='admin').first()
    
    aytac_user = User.objects.filter(first_name__icontains='Aytac', last_name__icontains='Mehdizade').first()
    if not aytac_user:
         # Fallback if specific user not found, try generic search or create
         print("Aytac not found, looking for any user named Aytac...")
         aytac_user = User.objects.filter(first_name__icontains='Aytac').first()
    
    users = []
    if admin_user: users.append(admin_user)
    if aytac_user: users.append(aytac_user)
    
    if not users:
        print("No users found to assign companies to.")
        return

    print(f"Found users: {[u.username for u in users]}")

    companies_data = [
        {
            "owner": admin_user if admin_user else users[0],
            "name": "Tech Innovators Ltd",
            "summary": "Leading the way in AI and machine learning solutions for enterprise.",
            "description": "Full description of Tech Innovators...",
            "logo_name": "tech_logo.svg",
            "who_we_are": ("Visionaries", "We are a team of dreamers and doers."),
            "what_we_do": ("AI Solutions", "Building the future of intelligence."),
            "values": ("Innovation", "We believe in pushing boundaries."),
            "service": ("Consulting", "Expert AI consulting.")
        },
        {
            "owner": aytac_user if aytac_user else users[0],
            "name": "Green Earth NGO",
            "summary": "Dedicated to sustainable living and environmental protection.",
            "description": "Green Earth is...",
            "logo_name": "green_logo.svg",
            "who_we_are": ("Activists", "Passionate about the planet."),
            "what_we_do": ("Reforestation", "Planting trees worldwide."),
            "values": ("Sustainability", "Green is the way."),
            "service": ("Workshops", "Educational workshops.")
        },
        {
            "owner": aytac_user if aytac_user else users[0],
            "name": "Creative Studio X",
            "summary": "Digital design and branding agency.",
            "description": "Design driven...",
            "logo_name": "design_logo.svg",
            "who_we_are": ("Artists", "Creativity is our DNA."),
            "what_we_do": ("Branding", "Creating visual identities."),
            "values": ("Beauty", "Aesthetics matter."),
            "service": ("Web Design", "Modern websites.")
        },
        {
            "owner": aytac_user if aytac_user else users[0],
            "name": "Finance Future",
            "summary": "Next-gen fintech solutions for personal banking.",
            "description": "Money smart...",
            "logo_name": "fin_logo.svg",
            "who_we_are": ("Bankers", "Secure and reliable."),
            "what_we_do": ("Mobile Banking", "Banking on the go."),
            "values": ("Trust", "Your money is safe."),
            "service": ("Investment", "Smart portfolio management.")
        }
    ]

    for data in companies_data:
        if not data["owner"]: continue
        
        slug = data["name"].lower().replace(' ', '-')
        if Company.objects.filter(slug=slug).exists():
             print(f"Company {data['name']} already exists, skipping.")
             continue

        company = Company.objects.create(
            owner=data["owner"],
            name=data["name"],
            slug=slug,
            summary=data["summary"],
            founded_at=timezone.now().date(),
            email=f"contact@{slug}.com",
            phone="+994501234567",
            website_url=f"https://{slug}.com",
            address="Baku, Azerbaijan"
        )
        # Add logo
        company.logo.save(data["logo_name"], create_dummy_image(data["logo_name"]), save=True)
        
        # Sections
        WhoWeAre.objects.create(company=company, title=data["who_we_are"][0], description=data["who_we_are"][1])
        WhatWeDo.objects.create(company=company, title=data["what_we_do"][0], description=data["what_we_do"][1])
        OurValues.objects.create(company=company, title=data["values"][0], description=data["values"][1])
        CompanyService.objects.create(company=company, title=data["service"][0], description=data["service"][1])
        
        print(f"Created company: {company.name}")

if __name__ == '__main__':
    run()
