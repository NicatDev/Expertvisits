from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.content.api.serializers import ArticleSerializer, PollSerializer, QuizSerializer
from apps.content.models import Article, Poll, Quiz
from core.feed_scoring import (
    annotate_engagement_counts,
    annotate_feed_rank,
    apply_feed_filters_article,
    apply_feed_filters_poll,
    apply_feed_filters_quiz,
    apply_scope_following,
    build_feed_cache_key,
    feed_cache_get,
    feed_cache_set,
    merge_mixed_feed_candidates,
    resolve_feed_mode,
    should_cache_feed_request,
)


def _user_cache_part(request):
    if request.user.is_authenticated:
        uid = request.user.pk
        prof = getattr(request.user, "profession_sub_category_id", None) or 0
        return f"{uid}:{prof}"
    return "anon"


def _serialize_feed_items(request, items):
    results = []
    for item in items:
        if isinstance(item, Article):
            data = ArticleSerializer(item, context={"request": request}).data
            data["type"] = "article"
        elif isinstance(item, Quiz):
            data = QuizSerializer(item, context={"request": request}).data
            data["type"] = "quiz"
        elif isinstance(item, Poll):
            data = PollSerializer(item, context={"request": request}).data
            data["type"] = "poll"
        else:
            continue
        results.append(data)
    return results


def _article_base():
    return Article.objects.select_related("author", "sub_category")


def _quiz_base():
    return Quiz.objects.select_related("author", "sub_category").prefetch_related("questions__choices")


def _poll_base():
    return Poll.objects.select_related("author", "sub_category").prefetch_related("options", "votes")


class FeedAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        type_param = request.query_params.get("type", "article")
        ordering_param = request.query_params.get("ordering", "-created_at")
        mode = resolve_feed_mode(ordering_param)
        search_query = request.query_params.get("search", "")
        limit = int(request.query_params.get("limit", 10))
        page = int(request.query_params.get("page", 1))
        scope_param = request.query_params.get("scope", "all")
        following_on = scope_param == "following" and request.user.is_authenticated

        cache_key = None
        if should_cache_feed_request(search_query, scope_param):
            cache_key = build_feed_cache_key(
                prefix="feed",
                type_param=type_param,
                mode=mode,
                scope=scope_param,
                page=page,
                limit=limit,
                user_part=_user_cache_part(request),
            )
            hit = feed_cache_get(cache_key)
            if hit is not None:
                return Response(hit)

        if type_param == "all":
            articles = apply_feed_filters_article(_article_base(), search_query)
            articles = apply_scope_following(articles, request.user, following_on)
            articles = annotate_engagement_counts(articles)
            articles = annotate_feed_rank(articles, mode, request.user)

            quizzes = apply_feed_filters_quiz(_quiz_base(), search_query)
            quizzes = apply_scope_following(quizzes, request.user, following_on)
            quizzes = annotate_engagement_counts(quizzes)
            quizzes = annotate_feed_rank(quizzes, mode, request.user)

            polls = apply_feed_filters_poll(_poll_base(), search_query)
            polls = apply_scope_following(polls, request.user, following_on)
            polls = annotate_engagement_counts(polls)
            polls = annotate_feed_rank(polls, mode, request.user)

            total = articles.count() + quizzes.count() + polls.count()
            page_items = merge_mixed_feed_candidates(articles, quizzes, polls, page, limit)
            payload = {"results": _serialize_feed_items(request, page_items), "count": total}
        else:
            if type_param == "quiz":
                queryset = apply_feed_filters_quiz(_quiz_base(), search_query)
                queryset = apply_scope_following(queryset, request.user, following_on)
                serializer_cls = QuizSerializer
            elif type_param == "poll":
                queryset = apply_feed_filters_poll(_poll_base(), search_query)
                queryset = apply_scope_following(queryset, request.user, following_on)
                serializer_cls = PollSerializer
            else:
                queryset = apply_feed_filters_article(_article_base(), search_query)
                queryset = apply_scope_following(queryset, request.user, following_on)
                serializer_cls = ArticleSerializer

            queryset = annotate_engagement_counts(queryset)
            queryset = annotate_feed_rank(queryset, mode, request.user)

            total = queryset.count()
            start = (page - 1) * limit
            end = start + limit
            items = queryset[start:end]
            data = serializer_cls(items, many=True, context={"request": request}).data
            for item in data:
                item["type"] = type_param
            payload = {"results": data, "count": total}

        if cache_key:
            feed_cache_set(cache_key, payload)
        return Response(payload)


class PublicFeedAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        type_param = request.query_params.get("type", "all")
        ordering_param = request.query_params.get("ordering", "-created_at")
        mode = resolve_feed_mode(ordering_param)
        search_query = request.query_params.get("search", "")
        user_id = request.query_params.get("user_id")
        limit = int(request.query_params.get("limit", 3))
        page = int(request.query_params.get("page", 1))

        if not user_id:
            return Response({"results": [], "count": 0})

        uid = int(user_id)

        cache_key = None
        if should_cache_feed_request(search_query, "all"):
            cache_key = build_feed_cache_key(
                prefix="pubfeed",
                type_param=type_param,
                mode=mode,
                scope=f"u{uid}",
                page=page,
                limit=limit,
                user_part=_user_cache_part(request),
            )
            hit = feed_cache_get(cache_key)
            if hit is not None:
                return Response(hit)

        if type_param == "all":
            articles = apply_feed_filters_article(
                _article_base().filter(author_id=uid), search_query
            )
            articles = annotate_engagement_counts(articles)
            articles = annotate_feed_rank(articles, mode, request.user)

            quizzes = apply_feed_filters_quiz(_quiz_base().filter(author_id=uid), search_query)
            quizzes = annotate_engagement_counts(quizzes)
            quizzes = annotate_feed_rank(quizzes, mode, request.user)

            polls = apply_feed_filters_poll(_poll_base().filter(author_id=uid), search_query)
            polls = annotate_engagement_counts(polls)
            polls = annotate_feed_rank(polls, mode, request.user)

            total = articles.count() + quizzes.count() + polls.count()
            page_items = merge_mixed_feed_candidates(articles, quizzes, polls, page, limit)
            payload = {"results": _serialize_feed_items(request, page_items), "count": total}
        else:
            if type_param == "quiz":
                queryset = _quiz_base().filter(author_id=uid)
                queryset = apply_feed_filters_quiz(queryset, search_query)
                serializer_cls = QuizSerializer
            elif type_param == "poll":
                queryset = _poll_base().filter(author_id=uid)
                queryset = apply_feed_filters_poll(queryset, search_query)
                serializer_cls = PollSerializer
            else:
                queryset = _article_base().filter(author_id=uid)
                queryset = apply_feed_filters_article(queryset, search_query)
                serializer_cls = ArticleSerializer

            queryset = annotate_engagement_counts(queryset)
            queryset = annotate_feed_rank(queryset, mode, request.user)

            total = queryset.count()
            items = queryset[(page - 1) * limit : page * limit]
            data = serializer_cls(items, many=True, context={"request": request}).data
            for item in data:
                item["type"] = type_param
            payload = {"results": data, "count": total}

        if cache_key:
            feed_cache_set(cache_key, payload)
        return Response(payload)


class UserFeedAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        type_param = request.query_params.get("type", "all")
        ordering_param = request.query_params.get("ordering", "-created_at")
        mode = resolve_feed_mode(ordering_param)
        search_query = request.query_params.get("search", "")
        limit = int(request.query_params.get("limit", 3))
        page = int(request.query_params.get("page", 1))

        cache_key = None
        if should_cache_feed_request(search_query, "all"):
            cache_key = build_feed_cache_key(
                prefix="myfeed",
                type_param=type_param,
                mode=mode,
                scope="me",
                page=page,
                limit=limit,
                user_part=_user_cache_part(request),
            )
            hit = feed_cache_get(cache_key)
            if hit is not None:
                return Response(hit)

        if type_param == "all":
            articles = apply_feed_filters_article(_article_base().filter(author=user), search_query)
            articles = annotate_engagement_counts(articles)
            articles = annotate_feed_rank(articles, mode, request.user)

            quizzes = apply_feed_filters_quiz(_quiz_base().filter(author=user), search_query)
            quizzes = annotate_engagement_counts(quizzes)
            quizzes = annotate_feed_rank(quizzes, mode, request.user)

            polls = apply_feed_filters_poll(_poll_base().filter(author=user), search_query)
            polls = annotate_engagement_counts(polls)
            polls = annotate_feed_rank(polls, mode, request.user)

            total = articles.count() + quizzes.count() + polls.count()
            page_items = merge_mixed_feed_candidates(articles, quizzes, polls, page, limit)
            payload = {"results": _serialize_feed_items(request, page_items), "count": total}
        else:
            if type_param == "quiz":
                queryset = apply_feed_filters_quiz(_quiz_base().filter(author=user), search_query)
                serializer_cls = QuizSerializer
            elif type_param == "poll":
                queryset = apply_feed_filters_poll(_poll_base().filter(author=user), search_query)
                serializer_cls = PollSerializer
            else:
                queryset = apply_feed_filters_article(_article_base().filter(author=user), search_query)
                serializer_cls = ArticleSerializer

            queryset = annotate_engagement_counts(queryset)
            queryset = annotate_feed_rank(queryset, mode, request.user)

            total = queryset.count()
            start = (page - 1) * limit
            end = start + limit
            items = queryset[start:end]
            data = serializer_cls(items, many=True, context={"request": request}).data
            for item in data:
                item["type"] = type_param
            payload = {"results": data, "count": total}

        if cache_key:
            feed_cache_set(cache_key, payload)
        return Response(payload)
