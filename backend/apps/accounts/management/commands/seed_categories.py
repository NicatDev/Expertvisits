from django.core.management.base import BaseCommand
from apps.accounts.models import Category, SubCategory

class Command(BaseCommand):
    help = 'Seeds initial categories and subcategories'

    def handle(self, *args, **kwargs):
        data = {
            "Technology": ["Software Development", "Data Science", "Cybersecurity", "AI & ML", "DevOps"],
            "Business": ["Marketing", "Finance", "Management", "Entrepreneurship", "Sales"],
            "Design": ["Graphic Design", "UI/UX Design", "Product Design", "Interior Design"],
            "Health": ["Medicine", "Psychology", "Nutrition", "Fitness"],
            "Education": ["Teaching", "Language Learning", "Science", "Mathematics"]
        }

        for cat_name, subs in data.items():
            category, created = Category.objects.get_or_create(name=cat_name)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created Category: {cat_name}'))
            
            for sub_name in subs:
                sub, sub_created = SubCategory.objects.get_or_create(category=category, name=sub_name)
                if sub_created:
                    self.stdout.write(f'  - Created SubCategory: {sub_name}')
        
        self.stdout.write(self.style.SUCCESS('Seeding complete!'))
