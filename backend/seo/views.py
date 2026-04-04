from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

from apps.accounts.models import User
from apps.business.models import Company, Vacancy
from apps.content.models import Article


CHUNK_LIMIT_DEFAULT = 45000
CHUNK_LIMIT_MAX = 45000


def _dt_iso(val):
    if val is None:
        return None
    if hasattr(val, 'isoformat'):
        return val.isoformat()
    return val


def _public_profile_users_qs():
    return User.objects.filter(is_active=True).exclude(username__startswith='admin')


def _static_url_dicts():
    return [
        {'url': '/', 'lastmod': None, 'changefreq': 'daily', 'priority': 1.0},
        {'url': '/vacancies', 'lastmod': None, 'changefreq': 'hourly', 'priority': 0.9},
        {'url': '/companies', 'lastmod': None, 'changefreq': 'daily', 'priority': 0.8},
        {'url': '/experts', 'lastmod': None, 'changefreq': 'daily', 'priority': 0.8},
    ]


def _iter_dynamic_url_dicts():
    for v in Vacancy.objects.all().iterator():
        yield {
            'url': f'/vacancies/{v.slug}',
            'lastmod': _dt_iso(getattr(v, 'updated_at', None) or getattr(v, 'posted_at', None)),
            'changefreq': 'daily',
            'priority': 0.8
        }

    for c in Company.objects.all().iterator():
        yield {
            'url': f'/companies/{c.slug}',
            'lastmod': _dt_iso(getattr(c, 'updated_at', None)),
            'changefreq': 'daily',
            'priority': 0.7
        }

    for a in Article.objects.all().iterator():
        yield {
            'url': f'/article/{a.slug}',
            'lastmod': _dt_iso(getattr(a, 'updated_at', None)),
            'changefreq': 'weekly',
            'priority': 0.7
        }

    for u in _public_profile_users_qs().iterator():
        yield {
            'url': f'/u/{u.username}',
            'lastmod': _dt_iso(getattr(u, 'updated_at', None)),
            'changefreq': 'weekly',
            'priority': 0.8
        }


def _collect_dynamic_url_dicts():
    return list(_iter_dynamic_url_dicts())


def _dynamic_slice(start, end):
    out = []
    for i, item in enumerate(_iter_dynamic_url_dicts()):
        if i < start:
            continue
        if i >= end:
            break
        out.append(item)
    return out


def _dynamic_total_count():
    return (
        Vacancy.objects.count()
        + Company.objects.count()
        + Article.objects.count()
        + _public_profile_users_qs().count()
    )


class SitemapMetaAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        dynamic_total = _dynamic_total_count()
        limit = CHUNK_LIMIT_DEFAULT
        chunk_count = max(1, (dynamic_total + limit - 1) // limit)
        return Response({
            'dynamic_total': dynamic_total,
            'chunk_limit': limit,
            'chunk_count': chunk_count,
        })


class SitemapAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        static_urls = _static_url_dicts()
        chunk_raw = request.query_params.get('chunk')
        if chunk_raw is None:
            return Response({
                'static_urls': static_urls,
                'dynamic_urls': _collect_dynamic_url_dicts(),
            })

        try:
            chunk = int(chunk_raw)
        except (TypeError, ValueError):
            return Response({'detail': 'Invalid chunk'}, status=400)

        if chunk < 0:
            return Response({'detail': 'Invalid chunk'}, status=400)

        limit = CHUNK_LIMIT_DEFAULT
        if request.query_params.get('limit') is not None:
            try:
                limit = int(request.query_params['limit'])
            except (TypeError, ValueError):
                return Response({'detail': 'Invalid limit'}, status=400)
            limit = max(1, min(limit, CHUNK_LIMIT_MAX))

        dynamic_total = _dynamic_total_count()
        chunk_count = max(1, (dynamic_total + limit - 1) // limit)
        if chunk >= chunk_count:
            return Response({'detail': 'Chunk out of range'}, status=404)

        start = chunk * limit
        end = start + limit
        dynamic_slice = _dynamic_slice(start, end)

        return Response({
            'static_urls': static_urls if chunk == 0 else [],
            'dynamic_urls': dynamic_slice,
            'chunk': chunk,
            'limit': limit,
        })
