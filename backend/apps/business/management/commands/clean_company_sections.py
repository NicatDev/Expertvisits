from django.core.management.base import BaseCommand
from django.db.models import Count
from apps.business.models import Company, WhoWeAre, WhatWeDo, OurValues

class Command(BaseCommand):
    help = 'Removes duplicate company sections to prepare for OneToOne conversion'

    def handle(self, *args, **options):
        self.clean_model(WhoWeAre, 'WhoWeAre')
        self.clean_model(WhatWeDo, 'WhatWeDo')
        self.clean_model(OurValues, 'OurValues')

    def clean_model(self, model_class, name):
        self.stdout.write(f"Cleaning {name}...")
        duplicates = model_class.objects.values('company').annotate(count=Count('id')).filter(count__gt=1)
        
        count_deleted = 0
        for item in duplicates:
            company_id = item['company']
            # Get all instances for this company, ordered by creation (newest last)
            instances = list(model_class.objects.filter(company_id=company_id).order_by('created_at'))
            
            # Keep the last one (newest), delete the rest
            to_delete = instances[:-1]
            for obj in to_delete:
                obj.delete()
                count_deleted += 1
        
        self.stdout.write(self.style.SUCCESS(f"Deleted {count_deleted} duplicate entries from {name}"))
