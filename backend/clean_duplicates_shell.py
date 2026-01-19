
from apps.business.models import Company
from django.db.models import Count

duplicates = Company.objects.values('owner').annotate(count=Count('id')).filter(count__gt=1)

print(f"Found {duplicates.count()} users with multiple companies.")

for entry in duplicates:
    owner_id = entry['owner']
    companies = Company.objects.filter(owner_id=owner_id).order_by('id')
    
    keep = companies.first()
    to_delete = companies.exclude(id=keep.id)
    
    print(f"User {owner_id}: Keeping {keep.name} (ID: {keep.id})")
    for c in to_delete:
        print(f"Deleting {c.name} (ID: {c.id})")
        c.delete()
