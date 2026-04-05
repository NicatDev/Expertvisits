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

        # Clear existing data - REMOVED as per user request
        # self.stdout.write('Clearing existing categories...')
        # Category.objects.all().delete()
        # self.stdout.write(self.style.SUCCESS('Cleared existing categories.'))

        for item in data:
            category_az = item['name_az']
            category_en = item['name_en']
            category_ru = item['name_ru']
            subcategories = item['subcategories']
            cat_ext = item.get('externalId') or item.get('external_id')
            if isinstance(cat_ext, str):
                cat_ext = cat_ext.strip() or None
            else:
                cat_ext = None

            if cat_ext:
                category, created = Category.objects.get_or_create(
                    external_id=cat_ext,
                    defaults={
                        'name_az': category_az,
                        'name_en': category_en,
                        'name_ru': category_ru,
                    },
                )
            else:
                category, created = Category.objects.get_or_create(
                    name_az=category_az,
                    defaults={
                        'name_en': category_en,
                        'name_ru': category_ru,
                    },
                )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created category: {category_az}'))
            else:
                self.stdout.write(f'Category already exists: {category_az}')

            for sub in subcategories:
                sub_az = sub['name_az']
                sub_en = sub['name_en']
                sub_ru = sub['name_ru']
                prof_az = sub.get('profession_az', '')
                prof_en = sub.get('profession_en', '')
                prof_ru = sub.get('profession_ru', '')
                sub_ext = sub.get('externalId') or sub.get('external_id')
                if isinstance(sub_ext, str):
                    sub_ext = sub_ext.strip() or None
                else:
                    sub_ext = None

                sub_defaults = {
                    'category': category,
                    'name_az': sub_az,
                    'name_en': sub_en,
                    'name_ru': sub_ru,
                    'profession_az': prof_az,
                    'profession_en': prof_en,
                    'profession_ru': prof_ru,
                }
                if sub_ext:
                    sub_cat, sub_created = SubCategory.objects.get_or_create(
                        external_id=sub_ext,
                        defaults=sub_defaults,
                    )
                else:
                    sub_cat, sub_created = SubCategory.objects.get_or_create(
                        category=category,
                        name_az=sub_az,
                        defaults={
                            'name_en': sub_en,
                            'name_ru': sub_ru,
                            'profession_az': prof_az,
                            'profession_en': prof_en,
                            'profession_ru': prof_ru,
                        },
                    )

                if sub_created:
                    self.stdout.write(self.style.SUCCESS(f'  Created subcategory: {sub_az} ({prof_az})'))
                else:
                    self.stdout.write(f'  Subcategory already exists: {sub_az}')

        self.stdout.write(self.style.SUCCESS('Successfully imported all categories'))
