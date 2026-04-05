from django.core.management.base import BaseCommand

from apps.content.models import Article, Poll, Quiz
from core.feed_scoring import bump_feed_cache_version, recompute_content_score


class Command(BaseCommand):
    help = "Recompute Article/Quiz/Poll.score from likes and non-author comments (backfill)."

    def handle(self, *args, **options):
        total = 0
        for model in (Article, Quiz, Poll):
            qs = model.objects.all().iterator(chunk_size=200)
            for obj in qs:
                recompute_content_score(obj)
                total += 1
        bump_feed_cache_version()
        self.stdout.write(self.style.SUCCESS(f"Processed {total} rows."))
