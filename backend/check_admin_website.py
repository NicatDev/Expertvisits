import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User
from apps.websites.models import UserWebsite

username = 'admin'
try:
    user = User.objects.get(username=username)
    print(f"User found: {user.username} (ID: {user.id})")
    
    websites = UserWebsite.objects.filter(user=user)
    if websites.exists():
        for ws in websites:
            print(f"Website found: ID {ws.id}, Active: {ws.is_active}, Deleted: {ws.is_deleted}, Template: {ws.template_id}")
    else:
        print("No website found for this user.")
except User.DoesNotExist:
    print(f"User '{username}' not found.")
except Exception as e:
    print(f"Error: {e}")
