from django.contrib.sitemaps import Sitemap
from django.urls import reverse
from django.conf import settings
from apps.accounts.models import User
from apps.business.models import Company, Vacancy
from apps.content.models import Article

# Base domain determination
BASE_DOMAIN = "expertvisits.com" if not settings.DEBUG else "localhost:3000"
PROTOCOL = 'https' if not settings.DEBUG else 'http'

class StaticViewSitemap(Sitemap):
    priority = 1.0
    changefreq = 'daily'
    protocol = PROTOCOL

    def get_domain(self, site=None):
        return BASE_DOMAIN

    def items(self):
        return ['/', '/about', '/vacancies', '/companies', '/experts', '/articles', '/contact']

    def location(self, item):
        return item

class ArticleSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.7
    protocol = PROTOCOL

    def get_domain(self, site=None):
        return BASE_DOMAIN

    def items(self):
        return Article.objects.all().order_by('-created_at')

    def location(self, obj):
        return f"/article/{obj.slug}"

    def lastmod(self, obj):
        return obj.updated_at

class CompanySitemap(Sitemap):
    changefreq = "daily"
    priority = 0.7
    protocol = PROTOCOL

    def get_domain(self, site=None):
        return BASE_DOMAIN

    def items(self):
        return Company.objects.all().order_by('name')

    def location(self, obj):
        return f"/companies/{obj.slug}"

class VacancySitemap(Sitemap):
    changefreq = "hourly"
    priority = 0.9
    protocol = PROTOCOL

    def get_domain(self, site=None):
        return BASE_DOMAIN

    def items(self):
        return Vacancy.objects.all().order_by('-posted_at')

    def location(self, obj):
        return f"/vacancies/{obj.slug}"

    def lastmod(self, obj):
        return obj.posted_at

class ProfileSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.8
    protocol = PROTOCOL

    def get_domain(self, site=None):
        return BASE_DOMAIN

    def items(self):
        return User.objects.filter(is_active=True).exclude(username__startswith='admin').order_by('username')

    def location(self, obj):
        return f"/u/{obj.username}"
