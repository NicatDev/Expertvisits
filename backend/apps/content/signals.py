from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from core.utils.storage_cleanup import delete_filefield_file, filefield_names_differ

from .models import Article, Poll, PollVote, Quiz


@receiver(pre_save, sender=Article)
def article_delete_replaced_image(sender, instance, **kwargs):
    """Məqalə şəkli dəyişəndə və ya silinəndə köhnə faylı storage-dən sil."""
    if not instance.pk:
        return
    try:
        old = Article.objects.only("image").get(pk=instance.pk)
    except Article.DoesNotExist:
        return
    if filefield_names_differ(old.image, instance.image):
        delete_filefield_file(old.image)


@receiver(post_delete, sender=Article)
def article_delete_image_on_delete(sender, instance, **kwargs):
    """Məqalə silinəndə şəkil faylını sil."""
    delete_filefield_file(instance.image)


@receiver(post_save, sender=Article)
@receiver(post_save, sender=Poll)
@receiver(post_save, sender=Quiz)
def content_created_bump_feed_cache(sender, instance, created, **kwargs):
    """Yeni məqalə/sorğu/test əlavə olanda feed keşində köhnə siyahı qalmasın."""
    if not created:
        return
    from core.feed_scoring import bump_feed_cache_version

    bump_feed_cache_version()


@receiver(post_delete, sender=Article)
@receiver(post_delete, sender=Poll)
@receiver(post_delete, sender=Quiz)
def content_deleted_bump_feed_cache(sender, instance, **kwargs):
    from core.feed_scoring import bump_feed_cache_version

    bump_feed_cache_version()


@receiver(post_save, sender=PollVote)
@receiver(post_delete, sender=PollVote)
def poll_vote_bump_feed_cache(sender, instance, **kwargs):
    """Səs verildikdə / silindikdə feed keşində poll.user_vote və faizlər köhnə qalmasın."""
    from core.feed_scoring import bump_feed_cache_version

    bump_feed_cache_version()
