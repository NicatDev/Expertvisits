from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.interactions.models import Comment, Like


@receiver([post_save, post_delete], sender=Like)
def like_changed_update_content_score(sender, instance, **kwargs):
    from core.feed_scoring import bump_feed_cache_version, recompute_content_score

    obj = instance.content_object
    if obj is None:
        return
    recompute_content_score(obj)
    bump_feed_cache_version()


@receiver([post_save, post_delete], sender=Comment)
def comment_changed_update_content_score(sender, instance, **kwargs):
    from core.feed_scoring import bump_feed_cache_version, recompute_content_score

    obj = instance.content_object
    if obj is None:
        return
    recompute_content_score(obj)
    bump_feed_cache_version()
