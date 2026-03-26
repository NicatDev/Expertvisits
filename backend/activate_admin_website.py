import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.websites.models import UserWebsite

updated = UserWebsite.objects.filter(user__username='admin').update(is_active=True, is_deleted=False)
if updated:
    print("Website for 'admin' activated successfully.")
else:
    print("No website found for user 'admin' or update failed.")
