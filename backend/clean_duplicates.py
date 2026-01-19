
import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.business.models import Company
from django.db.models import Count

def clean_duplicates():
    duplicates = Company.objects.values('owner').annotate(count=Count('id')).filter(count__gt=1)
    
    for entry in duplicates:
        owner_id = entry['owner']
        companies = Company.objects.filter(owner_id=owner_id).order_by('-founded_at')
        
        print(f"User {owner_id} owns {companies.count()} companies.")
        
        # Keep the most recently founded one, delete others? 
        # Or just keep the first one created? 
        # Let's keep the one with ID. order by id.
        companies = Company.objects.filter(owner_id=owner_id).order_by('id')
        
        keep = companies.first()
        to_delete = companies.exclude(id=keep.id)
        
        print(f"Keeping {keep.name} (ID: {keep.id})")
        for c in to_delete:
            print(f"Deleting {c.name} (ID: {c.id})")
            c.delete()

if __name__ == '__main__':
    clean_duplicates()
