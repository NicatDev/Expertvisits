import json
import os
from django.core.management.base import BaseCommand
from apps.accounts.models import Category, SubCategory
from django.conf import settings

class Command(BaseCommand):
    help = 'Import categories and subcategories from JSON file'

    def handle(self, *args, **kwargs):
        file_path = os.path.join(settings.BASE_DIR, 'categories.json')
        
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'File not found: {file_path}'))
            return

        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Clear existing data
        self.stdout.write('Clearing existing categories...')
        Category.objects.all().delete()
        self.stdout.write(self.style.SUCCESS('Cleared existing categories.'))

        for item in data:
            category_name = item['category']
            subcategories = item['subcategories']

            category, created = Category.objects.get_or_create(name=category_name)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created category: {category_name}'))
            else:
                self.stdout.write(f'Category exists: {category_name}')

            for sub in subcategories:
                sub_name = sub['name']
                profession = sub.get('profession', '')

                # Update or Create SubCategory
                sub_cat, sub_created = SubCategory.objects.update_or_create(
                    category=category,
                    name=sub_name,
                    defaults={'profession': profession}
                )

                if sub_created:
                    self.stdout.write(self.style.SUCCESS(f'  Created subcategory: {sub_name} ({profession})'))
                else:
                    self.stdout.write(f'  Updated subcategory: {sub_name}')

        self.stdout.write(self.style.SUCCESS('Successfully imported all categories'))
