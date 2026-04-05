"""
Feed ranking: denormalized engagement `score` on Article/Quiz/Poll plus dynamic rank for listing.

- score = likes * LIKE_POINTS + comments_not_by_author * COMMENT_POINTS (updated via signals)
- Popular vs new: different weights on score, time-tier bonus, and recency (new only)
- Logged-in: bonus if viewer profession_sub_category matches content author
"""
from __future__ import annotations

import hashlib
import json
from itertools import chain

from django.conf import settings
from django.core.cache import cache
from django.db import connection
from django.db.models import (
    Case,
    Count,
    ExpressionWrapper,
    F,
    FloatField,
    IntegerField,
    Q,
    Value,
    When,
)
from django.db.models.expressions import RawSQL

# Engagement (stored in DB column `score`)
LIKE_POINTS = 1
COMMENT_POINTS = 3

# Exclusive time windows (first match wins): extra points on top of rank formula
SECONDS_2H = 7200
SECONDS_1D = 86400
SECONDS_1W = 604800
TIME_BONUS_2H = 55
TIME_BONUS_1D = 32
TIME_BONUS_1W = 14

PROFESSION_BONUS = 45

# Popular: emphasize stored engagement
POP_SCORE_WEIGHT = 100
POP_TIME_WEIGHT = 1

# New: emphasize recency + smaller engagement; recency = NEW_RECENCY_NUMERATOR / (1 + age_hours)
NEW_RECENCY_NUMERATOR = 800_000.0
NEW_SCORE_WEIGHT = 22
NEW_TIME_WEIGHT = 6


def resolve_feed_mode(ordering_param: str) -> str:
    op = (ordering_param or "").lower().strip()
    if op in ("popularity", "popular", "-likes_count", "likes", "likes_count"):
        return "popular"
    return "new"


def _quoted_table_column(model) -> str:
    tbl = connection.ops.quote_name(model._meta.db_table)
    col = connection.ops.quote_name("created_at")
    return f"{tbl}.{col}"


def age_seconds_raw(model):
    col_expr = _quoted_table_column(model)
    vendor = connection.vendor
    if vendor == "postgresql":
        sql = f"EXTRACT(EPOCH FROM (NOW() - {col_expr}))::double precision"
    elif vendor == "sqlite":
        sql = f"(strftime('%%s','now') - strftime('%%s', {col_expr}))"
    else:
        # MySQL / MariaDB
        sql = f"TIMESTAMPDIFF(SECOND, {col_expr}, NOW())"
    return RawSQL(sql, [], output_field=FloatField())


def annotate_time_tier(queryset):
    model = queryset.model
    return queryset.annotate(_age_sec=age_seconds_raw(model)).annotate(
        _time_tier=Case(
            When(_age_sec__lt=SECONDS_2H, then=Value(TIME_BONUS_2H)),
            When(_age_sec__lt=SECONDS_1D, then=Value(TIME_BONUS_1D)),
            When(_age_sec__lt=SECONDS_1W, then=Value(TIME_BONUS_1W)),
            default=Value(0),
            output_field=IntegerField(),
        ),
    )


def annotate_profession_match(queryset, user):
    if user and user.is_authenticated and getattr(user, "profession_sub_category_id", None):
        return queryset.annotate(
            _prof_bonus=Case(
                When(
                    author__profession_sub_category_id=user.profession_sub_category_id,
                    then=Value(PROFESSION_BONUS),
                ),
                default=Value(0),
                output_field=IntegerField(),
            ),
        )
    return queryset.annotate(_prof_bonus=Value(0, output_field=IntegerField()))


def annotate_feed_rank(queryset, mode: str, user):
    mode = "popular" if mode == "popular" else "new"
    qs = annotate_time_tier(queryset)
    qs = annotate_profession_match(qs, user)

    if mode == "popular":
        rank = ExpressionWrapper(
            F("score") * Value(POP_SCORE_WEIGHT)
            + F("_time_tier") * Value(POP_TIME_WEIGHT)
            + F("_prof_bonus"),
            output_field=FloatField(),
        )
    else:
        rank = ExpressionWrapper(
            Value(NEW_RECENCY_NUMERATOR) / (Value(1.0) + F("_age_sec") / Value(3600.0))
            + F("score") * Value(NEW_SCORE_WEIGHT)
            + F("_time_tier") * Value(NEW_TIME_WEIGHT)
            + F("_prof_bonus"),
            output_field=FloatField(),
        )

    return qs.annotate(_feed_rank=rank).order_by("-_feed_rank", "-created_at")


def merge_mixed_feed_candidates(articles_qs, quizzes_qs, polls_qs, page: int, limit: int):
    """
    Fetch a bounded window per content type, merge-sort in Python (avoids loading full tables).
    Deep pages are approximate; increase oversample if needed.
    """
    cap = getattr(settings, "FEED_MERGE_CANDIDATE_CAP", 2000)
    oversample = min(max(page * limit * 5, limit * 4), cap)

    a = list(articles_qs[:oversample])
    q = list(quizzes_qs[:oversample])
    p = list(polls_qs[:oversample])

    combined = sorted(
        chain(a, q, p),
        key=lambda x: (getattr(x, "_feed_rank", 0.0), x.created_at),
        reverse=True,
    )
    start = (page - 1) * limit
    return combined[start : start + limit]


def recompute_content_score(obj) -> None:
    """Update denormalized score from likes + comments (exclude author's own comments)."""
    from apps.content.models import Article, Poll, Quiz

    if not isinstance(obj, (Article, Quiz, Poll)):
        return
    if not obj.pk:
        return

    likes_n = obj.likes.count()
    comments_n = obj.comments.exclude(user_id=obj.author_id).count()
    new_score = likes_n * LIKE_POINTS + comments_n * COMMENT_POINTS

    model = type(obj)
    model.objects.filter(pk=obj.pk).exclude(score=new_score).update(score=new_score)


def bump_feed_cache_version() -> None:
    try:
        cache.incr("feed_cache_ver")
    except ValueError:
        cache.set("feed_cache_ver", 1, timeout=None)


def feed_cache_version() -> int:
    return int(cache.get("feed_cache_ver") or 0)


def should_cache_feed_request(search_query: str, scope_param: str) -> bool:
    if search_query and search_query.strip():
        return False
    if scope_param == "following":
        return getattr(settings, "FEED_CACHE_FOLLOWING", False)
    return True


def build_feed_cache_key(
    *,
    prefix: str,
    type_param: str,
    mode: str,
    scope: str,
    page: int,
    limit: int,
    user_part: str,
    extra: dict | None = None,
) -> str:
    payload = {
        "v": feed_cache_version(),
        "p": prefix,
        "t": type_param,
        "m": mode,
        "s": scope,
        "page": page,
        "limit": limit,
        "u": user_part,
        "e": extra or {},
    }
    h = hashlib.sha256(json.dumps(payload, sort_keys=True, default=str).encode()).hexdigest()[:40]
    return f"feed:{h}"


def feed_cache_get(key: str):
    ttl = getattr(settings, "FEED_CACHE_TTL", 60)
    if ttl <= 0:
        return None
    return cache.get(key)


def feed_cache_set(key: str, data: dict) -> None:
    ttl = getattr(settings, "FEED_CACHE_TTL", 60)
    if ttl <= 0:
        return
    cache.set(key, data, timeout=ttl)


def annotate_engagement_counts(queryset):
    return queryset.annotate(
        likes_count=Count("likes", distinct=True),
        comments_count=Count("comments", distinct=True),
    )


def apply_feed_filters_article(queryset, search_query: str):
    if search_query:
        return queryset.filter(Q(title__icontains=search_query) | Q(body__icontains=search_query))
    return queryset


def apply_feed_filters_quiz(queryset, search_query: str):
    if search_query:
        return queryset.filter(title__icontains=search_query)
    return queryset


def apply_feed_filters_poll(queryset, search_query: str):
    if search_query:
        return queryset.filter(question__icontains=search_query)
    return queryset


def apply_scope_following(queryset, user, enabled: bool):
    """Only mutual connections (both users follow each other)."""
    if enabled and user and user.is_authenticated:
        from django.contrib.auth import get_user_model

        User = get_user_model()
        follower_ids = user.followers.values_list("id", flat=True)
        mutual_ids = user.following.filter(id__in=follower_ids).values_list("id", flat=True)
        return queryset.filter(author__in=mutual_ids)
    return queryset
