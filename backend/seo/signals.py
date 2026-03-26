import logging
import requests
from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.content.models import Article

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Article)
def ping_google_on_new_article(sender, instance, created, **kwargs):
    if created:
        sitemap_url = 'https://expertvisits.com/sitemap.xml'
        ping_url = f'https://www.google.com/ping?sitemap={sitemap_url}'
        try:
            response = requests.get(ping_url, timeout=5)
            if response.status_code == 200:
                logger.info(f"Successfully pinged Google for sitemap update after Article {instance.id} creation.")
            else:
                logger.warning(f"Failed to ping Google. Status code: {response.status_code}")
        except Exception as e:
            logger.error(f"Error pinging Google for Article {instance.id}: {str(e)}")
