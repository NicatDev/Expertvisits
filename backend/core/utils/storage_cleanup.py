"""Disk/S3-də köhnə faylları təmizləmək (FileField/ImageField)."""
import logging

logger = logging.getLogger(__name__)


def delete_filefield_file(fieldfile) -> None:
    """
    Storage-dən faylı silir (save=False — model yenidən saxlanılmır).
    Fayl yoxdursa və ya silmə xətası olarsa udur.
    """
    if not fieldfile:
        return
    name = getattr(fieldfile, "name", None) or ""
    if not name:
        return
    try:
        fieldfile.delete(save=False)
    except Exception as e:
        logger.warning("storage_cleanup: could not delete file %s: %s", name, e)


def filefield_names_differ(old_file, new_file) -> bool:
    """Köhnə və yeni fayl yolları fərqlidirsə True (və ya biri boşaldılıb)."""
    old_name = old_file.name if old_file else ""
    new_name = new_file.name if new_file else ""
    if not old_name:
        return False
    return old_name != new_name
