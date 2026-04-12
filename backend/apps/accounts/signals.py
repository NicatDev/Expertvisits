from django.db.models.signals import post_delete, pre_save
from django.dispatch import receiver

from core.utils.storage_cleanup import delete_filefield_file, filefield_names_differ

from .models import User

_USER_IMAGE_FIELDS = ("avatar", "avatar_compressed", "cover_image")


@receiver(pre_save, sender=User)
def user_delete_replaced_image_files(sender, instance, **kwargs):
    """Profil/cover şəkli dəyişəndə və ya təmizlənəndə köhnə faylı storage-dən sil."""
    if not instance.pk:
        return
    try:
        old = User.objects.only(*_USER_IMAGE_FIELDS).get(pk=instance.pk)
    except User.DoesNotExist:
        return
    for attr in _USER_IMAGE_FIELDS:
        old_f = getattr(old, attr)
        new_f = getattr(instance, attr)
        if filefield_names_differ(old_f, new_f):
            delete_filefield_file(old_f)


@receiver(post_delete, sender=User)
def user_delete_image_files_on_delete(sender, instance, **kwargs):
    """İstifadəçi silinəndə bütün şəkil fayllarını sil."""
    for attr in _USER_IMAGE_FIELDS:
        delete_filefield_file(getattr(instance, attr, None))
