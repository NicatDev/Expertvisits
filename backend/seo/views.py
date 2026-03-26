from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

from apps.accounts.models import User
from apps.business.models import Company, Vacancy
from apps.content.models import Article

class SitemapAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        urls = []

        # Platform static urls
        static_urls = [
            {'url': '/', 'lastmod': None, 'changefreq': 'daily', 'priority': 1.0},
            {'url': '/about', 'lastmod': None, 'changefreq': 'monthly', 'priority': 0.8},
            {'url': '/vacancies', 'lastmod': None, 'changefreq': 'hourly', 'priority': 0.9},
            {'url': '/companies', 'lastmod': None, 'changefreq': 'daily', 'priority': 0.8},
            {'url': '/experts', 'lastmod': None, 'changefreq': 'daily', 'priority': 0.8},
            {'url': '/articles', 'lastmod': None, 'changefreq': 'weekly', 'priority': 0.8},
            {'url': '/contact', 'lastmod': None, 'changefreq': 'monthly', 'priority': 0.6},
        ]
        
        # Add frontend_platform base dynamic routes
        for v in Vacancy.objects.all():
            urls.append({
                'url': f'/vacancies/{v.slug}',
                'lastmod': v.updated_at.isoformat() if hasattr(v, 'updated_at') else None,
                'changefreq': 'daily',
                'priority': 0.8
            })

        for c in Company.objects.all():
            urls.append({
                'url': f'/companies/{c.slug}',
                'lastmod': c.updated_at.isoformat() if hasattr(c, 'updated_at') else None,
                'changefreq': 'daily',
                'priority': 0.7
            })

        for a in Article.objects.all():
            urls.append({
                'url': f'/article/{a.slug}',
                'lastmod': a.updated_at.isoformat() if hasattr(a, 'updated_at') else None,
                'changefreq': 'weekly',
                'priority': 0.7
            })

        # Portfolio dynamic routes (/u/[username])
        # Include active users
        for u in User.objects.filter(is_active=True).exclude(username__startswith='admin'):
            urls.append({
                'url': f'/u/{u.username}',
                'lastmod': getattr(u, 'updated_at', None),
                'changefreq': 'weekly',
                'priority': 0.8
            })
            urls.append({
                'url': f'/u/{u.username}/contact',
                'lastmod': getattr(u, 'updated_at', None),
                'changefreq': 'monthly',
                'priority': 0.6
            })
            # Articles inside portfolio are set to noindex, so we do not include them.

        # Serialize list
        return Response({
            'static_urls': static_urls,
            'dynamic_urls': urls
        })
