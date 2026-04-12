from django.db.models.signals import post_delete, pre_save
from django.dispatch import receiver

from core.utils.storage_cleanup import delete_filefield_file, filefield_names_differ

from .models import Article


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
