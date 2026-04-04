from django.urls import path
from .views import SitemapAPIView, SitemapMetaAPIView

urlpatterns = [
    path('sitemap/meta/', SitemapMetaAPIView.as_view(), name='sitemap-meta-api'),
    path('sitemap/', SitemapAPIView.as_view(), name='sitemap-api'),
]
