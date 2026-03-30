import os
import django
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.accounts.models import SubCategory
from apps.profiles.models import Experience, Education, Skill, Language, Certificate
from datetime import date

User = get_user_model()

class Command(BaseCommand):
    help = 'Create a new expert user with full profile details (Nigar Aliyeva example)'

    def handle(self, *args, **kwargs):
        # 1. Basic User Data
        email = "nigarrraliyevaaaa123123@gmail.com"
        username = "nigar_aliyeva"
        password = "test-123"
        first_name = "Nigar"
        last_name = "Əliyeva"
        phone_number = "+9945154586578"
        birth_day = date(1992, 1, 1)
        city = "Bakı"
        
        description = (
            "Dr. Nigar Əliyeva həzm sistemi xəstəlikləri üzrə ixtisaslaşmış həkimdir. "
            "Qəbizlik, babasil (hemoroid), bağırsaq problemləri və mədə-bağırsaq xəstəliklərinin "
            "diaqnostika və müalicəsində təcrübəyə malikdir. Pasiyentlərə fərdi yanaşma və "
            "profilaktik tədbirlərlə uzunmüddətli sağlamlıq nəticələri əldə etməyə kömək edir."
        )

        # Try to find a matching subcategory (e.g. Gastroenterology)
        sub_cat = SubCategory.objects.filter(name_az__icontains='Qastroenterologiya').first()
        if not sub_cat:
            # Fallback if not found
            sub_cat = SubCategory.objects.first()

        # Create or Update User
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': username,
                'first_name': first_name,
                'last_name': last_name,
                'phone_number': phone_number,
                'birth_day': birth_day,
                'city': city,
                'summary': description,
                'profession_sub_category': sub_cat,
                'is_active': True,
            }
        )

        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Successfully created user: {email}'))
        else:
            self.stdout.write(self.style.WARNING(f'User with email {email} already exists. Skipping user creation.'))

        # 2. Education
        education_data = [
            {
                "degree_type": "bachelor",
                "institution": "Azərbaycan Tibb Universiteti",
                "field_of_study": "Müalicə işi",
                "start_date": date(2010, 9, 1),
                "end_date": date(2016, 6, 30)
            },
            {
                "degree_type": "master", # Residentura mapping
                "institution": "Azərbaycan Tibb Universiteti",
                "field_of_study": "Rezidentura – Qastroenterologiya",
                "start_date": date(2016, 9, 1),
                "end_date": date(2020, 6, 30)
            }
        ]

        for edu in education_data:
            Education.objects.get_or_create(
                user=user,
                institution=edu['institution'],
                field_of_study=edu['field_of_study'],
                defaults={
                    'degree_type': edu['degree_type'],
                    'start_date': edu['start_date'],
                    'end_date': edu['end_date']
                }
            )

        # 3. Work Experience
        experience_data = [
            {
                "position": "Qastroenteroloq",
                "company_name": "Özəl klinika",
                "start_date": date(2020, 1, 1),
                "end_date": None # Ongoing
            },
            {
                "position": "Rezident həkim",
                "company_name": "Dövlət tibb müəssisəsi",
                "start_date": date(2016, 9, 1),
                "end_date": date(2020, 1, 1)
            }
        ]

        for exp in experience_data:
            Experience.objects.get_or_create(
                user=user,
                position=exp['position'],
                company_name=exp['company_name'],
                defaults={
                    'start_date': exp['start_date'],
                    'end_date': exp['end_date']
                }
            )

        # 4. Skills (Technical and Soft)
        # Technical / Hard Skills
        hard_skills = [
            "Endoskopik müayinə", "Kolonoskopiya", "Laborator analizlərin interpretasiyası",
            "Diaqnostik planlama", "Müalicə protokollarının tətbiqi",
            "Babasil (hemoroid)", "Qəbizlik və bağırsaq problemləri", 
            "Qastrit və mədə xəstəlikləri", "İrritabl bağırsaq sindromu (IBS)"
        ]
        for skill_name in hard_skills:
            Skill.objects.get_or_create(user=user, name=skill_name, skill_type='hard')

        # Soft Skills
        soft_skills = [
            "Pasiyentlə effektiv ünsiyyət", "Empati və diqqətli yanaşma",
            "Komanda ilə işləmə", "Analitik düşüncə", "Stress altında qərarvermə"
        ]
        for skill_name in soft_skills:
            Skill.objects.get_or_create(user=user, name=skill_name, skill_type='soft')

        # 5. Languages
        languages = [
            {"name": "Azərbaycan dili", "level": "c2"},
            {"name": "Rus dili", "level": "b2"},
            {"name": "İngilis dili", "level": "b1"},
        ]
        for lang in languages:
            Language.objects.get_or_create(user=user, name=lang['name'], defaults={'level': lang['level']})

        # 6. Certifications
        certs = [
            "Qastroenterologiya üzrə ixtisaslaşma sertifikatı",
            "Endoskopiya üzrə təlim sertifikatı",
            "Müasir həzm sistemi xəstəliklərinin diaqnostikası kursu",
            "Minimal invaziv müalicə üsulları üzrə təlim"
        ]
        for cert_name in certs:
            Certificate.objects.get_or_create(
                user=user, 
                name=cert_name, 
                defaults={
                    'issuing_organization': 'Təhsil Müəssisəsi / Səhiyyə Nazirliyi',
                    'issue_date': date(2021, 1, 1) # Fake date
                }
            )

        self.stdout.write(self.style.SUCCESS(f'Profile for {first_name} {last_name} has been populated.'))
