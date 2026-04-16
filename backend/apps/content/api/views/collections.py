from django.db.models import F, Prefetch, Q
from rest_framework import generics, permissions, pagination
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.content.api.serializers import (
    CollectionCreateUpdateSerializer,
    CollectionSerializer,
)
from apps.content.models import Article, Collection, CollectionItem, Quiz


class CollectionPagination(pagination.PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 30


class CollectionListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = CollectionPagination

    def get_queryset(self):
        valid_items_qs = (
            CollectionItem.objects.filter(Q(article__isnull=False) | Q(quiz__isnull=False))
            .select_related('article', 'quiz', 'article__author', 'quiz__author')
            .order_by('order', 'id')
        )
        qs = Collection.objects.select_related('author').prefetch_related(
            Prefetch('items', queryset=valid_items_qs),
        )
        scope = (self.request.query_params.get('scope') or 'all').lower()
        search = (self.request.query_params.get('search') or '').strip()
        if scope == 'mine':
            if not self.request.user.is_authenticated:
                return Collection.objects.none()
            qs = qs.filter(author=self.request.user)
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(summary__icontains=search))
        return qs.order_by('-created_at')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CollectionCreateUpdateSerializer
        return CollectionSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save(author=request.user)
        out = CollectionSerializer(instance, context={'request': request})
        return Response(out.data, status=201)


class CollectionDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'
    lookup_url_kwarg = 'slug'

    def get_queryset(self):
        valid_items_qs = (
            CollectionItem.objects.filter(Q(article__isnull=False) | Q(quiz__isnull=False))
            .select_related('article', 'quiz', 'article__author', 'quiz__author')
            .order_by('order', 'id')
        )
        return Collection.objects.select_related('author').prefetch_related(
            Prefetch('items', queryset=valid_items_qs),
        )

    def get_serializer_class(self):
        if self.request.method in ('PATCH', 'PUT'):
            return CollectionCreateUpdateSerializer
        return CollectionSerializer

    def check_object_permissions(self, request, obj):
        if request.method in permissions.SAFE_METHODS:
            return super().check_object_permissions(request, obj)
        if not request.user.is_authenticated or obj.author_id != request.user.id:
            self.permission_denied(request)
        return super().check_object_permissions(request, obj)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        Collection.objects.filter(pk=instance.pk).update(view_count=F('view_count') + 1)
        instance.refresh_from_db(fields=['view_count'])
        serializer = CollectionSerializer(instance, context={'request': request})
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        out = CollectionSerializer(instance, context={'request': request})
        return Response(out.data)


class CollectionContentOptionsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        articles = (
            Article.objects.filter(author=request.user)
            .only('id', 'title', 'slug', 'created_at')
            .order_by('-created_at')
        )
        quizzes = (
            Quiz.objects.filter(author=request.user)
            .only('id', 'title', 'slug', 'created_at')
            .order_by('-created_at')
        )
        return Response(
            {
                'articles': [
                    {
                        'id': a.id,
                        'title': a.title,
                        'slug': a.slug,
                        'created_at': a.created_at,
                        'content_type': 'article',
                    }
                    for a in articles
                ],
                'quizzes': [
                    {
                        'id': q.id,
                        'title': q.title,
                        'slug': q.slug,
                        'created_at': q.created_at,
                        'content_type': 'quiz',
                    }
                    for q in quizzes
                ],
            }
        )

