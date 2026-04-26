import os
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
try:
    import django
    django.setup()
except Exception as e:
    print(f"Error setting up Django: {e}")
    sys.exit(1)

from apps.accounts.models import User
from apps.content.models import Article, Quiz
from django.db.models import Count, OuterRef, Subquery, IntegerField, F
from django.db.models.functions import Coalesce

def debug_experts_query():
    articles_sq = Article.objects.filter(author=OuterRef('pk')).values('author').annotate(c=Count('id')).values('c')
    quizzes_sq = Quiz.objects.filter(author=OuterRef('pk')).values('author').annotate(c=Count('id')).values('c')

    queryset = User.objects.annotate(
        followers_count=Count('followers', distinct=True),
        article_count=Coalesce(Subquery(articles_sq, output_field=IntegerField()), 0),
        quiz_count=Coalesce(Subquery(quizzes_sq, output_field=IntegerField()), 0)
    ).annotate(
        content_score=F('article_count') + F('quiz_count')
    ).filter(is_searchable=True).order_by('-content_score', '-followers_count')

    print("--- Top 10 Experts ---")
    for u in queryset[:10]:
        print(f"ID: {u.id}, User: {u.username}, Articles: {u.article_count}, Quizzes: {u.quiz_count}, Score: {u.content_score}, Followers: {u.followers_count}")
        
    print("\nSQL QUERY:")
    print(str(queryset.query))

if __name__ == '__main__':
    debug_experts_query()
