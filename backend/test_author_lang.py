import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from apps.content.models import Article

articles = Article.objects.filter(title__icontains='ecəsən')
for a in articles:
    print(f"Author ({a.author.username}) language: {a.author.language}")
    print(f"Author summary: {a.author.summary}")
    print(f"Article language: {a.language}")
