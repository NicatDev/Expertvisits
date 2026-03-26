from django.urls import path
from .views import SitemapAPIView

urlpatterns = [
    path('sitemap/', SitemapAPIView.as_view(), name='sitemap-api'),
]
