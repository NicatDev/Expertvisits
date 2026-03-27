import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User
from core.utils.language import detect_language

users = User.objects.exclude(summary__isnull=True).exclude(summary='')
for u in users:
    lang = detect_language(u.summary)
    User.objects.filter(pk=u.pk).update(language=lang)

print("Updated user languages!")
