import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from apps.content.models import Article
from core.utils.language import detect_language

articles = Article.objects.filter(title__icontains='necəsən')
for a in articles:
    print(f"Title: {a.title}")
    text = f"{a.title} {a.body[:500]}"
    print(f"Computed text: {text}")
    print(f"Current language in DB: {a.language}")
    print(f"Detect Language Returns: {detect_language(text)}")
