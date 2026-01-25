from rest_framework.views import APIView
from rest_framework import permissions, generics
from rest_framework.response import Response
from django.db.models import Count, Q
from apps.content.models import Article, Quiz, Poll
from apps.content.api.serializers import ArticleSerializer, QuizSerializer, PollSerializer
from itertools import chain

class FeedAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        type_param = request.query_params.get('type', 'article')
        ordering_param = request.query_params.get('ordering', '-created_at')
        search_query = request.query_params.get('search', '')
        limit = int(request.query_params.get('limit', 10))
        page = int(request.query_params.get('page', 1))

        if type_param == 'all':
            # Complex merging logic
            articles = Article.objects.select_related('author', 'sub_category').annotate(
                likes_count=Count('likes', distinct=True), 
                comments_count=Count('comments', distinct=True)
            )
            quizzes = Quiz.objects.prefetch_related('questions__choices').annotate(
                likes_count=Count('likes', distinct=True),
                comments_count=Count('comments', distinct=True)
            )
            polls = Poll.objects.prefetch_related('options', 'votes').annotate(
                likes_count=Count('likes', distinct=True), 
                comments_count=Count('comments', distinct=True)
            )

            
            scope_param = request.query_params.get('scope', 'all')
            if scope_param == 'following' and request.user.is_authenticated:
                following_ids = request.user.following.values_list('id', flat=True)
                articles = articles.filter(author__in=following_ids)
                quizzes = quizzes.filter(author__in=following_ids)
                polls = polls.filter(author__in=following_ids)

            if search_query:
                articles = articles.filter(Q(title__icontains=search_query) | Q(body__icontains=search_query))
                quizzes = quizzes.filter(title__icontains=search_query)
                polls = polls.filter(question__icontains=search_query)


            def get_sort_key(instance):
                if ordering_param == 'popularity':
                    return (instance.likes_count, instance.created_at)
                return instance.created_at

            combined = sorted(
                chain(articles, quizzes, polls),
                key=get_sort_key,
                reverse=True
            )
            
            count = len(combined)
            start = (page - 1) * limit
            end = start + limit
            page_items = combined[start:end]
            
            results = []
            for item in page_items:
                if isinstance(item, Article):
                    data = ArticleSerializer(item, context={'request': request}).data
                    data['type'] = 'article'
                elif isinstance(item, Quiz):
                    data = QuizSerializer(item, context={'request': request}).data
                    data['type'] = 'quiz'
                elif isinstance(item, Poll):
                    data = PollSerializer(item, context={'request': request}).data
                    data['type'] = 'poll'

                results.append(data)
            
            return Response({'results': results, 'count': count})
        
        else:
            # Single Type
            queryset = None
            serializer_cls = None
            
            if type_param == 'quiz':
                queryset = Quiz.objects.prefetch_related('questions__choices')
                if search_query: queryset = queryset.filter(title__icontains=search_query)
                serializer_cls = QuizSerializer
            
            elif type_param == 'poll':
                queryset = Poll.objects.prefetch_related('options', 'votes')
                if search_query: queryset = queryset.filter(question__icontains=search_query)
                serializer_cls = PollSerializer

            else: # article
                queryset = Article.objects.select_related('author', 'sub_category')
                if search_query: queryset = queryset.filter(Q(title__icontains=search_query) | Q(body__icontains=search_query))
                serializer_cls = ArticleSerializer

            scope_param = request.query_params.get('scope', 'all')
            if scope_param == 'following' and request.user.is_authenticated:
                queryset = queryset.filter(author__in=request.user.following.values_list('id', flat=True))

            queryset = queryset.annotate(
                likes_count=Count('likes', distinct=True),
                comments_count=Count('comments', distinct=True)
            )

            if ordering_param == 'popularity':
                queryset = queryset.order_by('-likes_count', '-created_at')
            else:
                queryset = queryset.order_by('-created_at')
            
            # Pagination
            count = queryset.count()
            start = (page - 1) * limit
            end = start + limit
            items = queryset[start:end]
            
            data = serializer_cls(items, many=True, context={'request': request}).data
            
            # Inject Type
            for item in data:
                item['type'] = type_param
            
            return Response({'results': data, 'count': count})


class PublicFeedAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        type_param = request.query_params.get('type', 'all')
        search_query = request.query_params.get('search', '')
        user_id = request.query_params.get('user_id')
        limit = int(request.query_params.get('limit', 3))
        page = int(request.query_params.get('page', 1))

        if not user_id:
            return Response({'results': [], 'count': 0})
        
        # Similar logic to FeedAPIView but filtered by user_id
        if type_param == 'all':
            articles = Article.objects.filter(author_id=user_id).select_related('author', 'sub_category').annotate(likes_count=Count('likes', distinct=True), comments_count=Count('comments', distinct=True))
            quizzes = Quiz.objects.filter(author_id=user_id).prefetch_related('questions__choices').annotate(likes_count=Count('likes', distinct=True), comments_count=Count('comments', distinct=True))
            polls = Poll.objects.filter(author_id=user_id).prefetch_related('options', 'votes').annotate(likes_count=Count('likes', distinct=True), comments_count=Count('comments', distinct=True))

            
            if search_query:
                # Same search logic
                articles = articles.filter(Q(title__icontains=search_query) | Q(body__icontains=search_query))
                quizzes = quizzes.filter(title__icontains=search_query)
                polls = polls.filter(question__icontains=search_query)


            combined = sorted(
                chain(articles, quizzes, polls),
                key=lambda instance: instance.created_at,
                reverse=True
            )
            
            count = len(combined)
            start = (page - 1) * limit
            end = start + limit
            page_items = combined[start:end]
            
            results = []
            for item in page_items:
                if isinstance(item, Article):
                    data = ArticleSerializer(item, context={'request': request}).data
                    data['type'] = 'article'
                elif isinstance(item, Quiz):
                    data = QuizSerializer(item, context={'request': request}).data
                    data['type'] = 'quiz'
                elif isinstance(item, Poll):
                    data = PollSerializer(item, context={'request': request}).data
                    data['type'] = 'poll'

                results.append(data)
            
            return Response({'results': results, 'count': count})
        
        else:
            # Single type
            if type_param == 'quiz':
                queryset = Quiz.objects.filter(author_id=user_id).prefetch_related('questions__choices')
                serializer_cls = QuizSerializer

            elif type_param == 'poll':
                queryset = Poll.objects.filter(author_id=user_id).prefetch_related('options', 'votes')
                serializer_cls = PollSerializer

            else: 
                queryset = Article.objects.filter(author_id=user_id).select_related('author', 'sub_category')
                serializer_cls = ArticleSerializer

            if search_query:
                # Add filters
                pass
            
            queryset = queryset.annotate(
                likes_count=Count('likes', distinct=True),
                comments_count=Count('comments', distinct=True)
            ).order_by('-created_at')
            
            count = queryset.count()
            items = queryset[(page-1)*limit : page*limit]
            
            data = serializer_cls(items, many=True, context={'request': request}).data
             # Inject Type
            for item in data:
                item['type'] = type_param
                
            return Response({'results': data, 'count': count})


class UserFeedAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # reuse PublicFeed logic but for request.user
        # For brevity, implementing directly or could inherit/reuse
        # It's essentially "PublicFeed" with user=request.user and IsAuthenticated
        
        user = request.user
        type_param = request.query_params.get('type', 'all')
        search_query = request.query_params.get('search', '')
        limit = int(request.query_params.get('limit', 3))
        page = int(request.query_params.get('page', 1))

        if type_param == 'all':
            articles = Article.objects.filter(author=user).select_related('author', 'sub_category').annotate(likes_count=Count('likes', distinct=True), comments_count=Count('comments', distinct=True))
            quizzes = Quiz.objects.filter(author=user).prefetch_related('questions__choices').annotate(likes_count=Count('likes', distinct=True), comments_count=Count('comments', distinct=True))
            polls = Poll.objects.filter(author=user).prefetch_related('options', 'votes').annotate(likes_count=Count('likes', distinct=True), comments_count=Count('comments', distinct=True))

            # Search...
            
            combined = sorted(
                chain(articles, quizzes, polls),
                key=lambda instance: instance.created_at,
                reverse=True
            )
             
            count = len(combined)
            page_items = combined[(page-1)*limit : page*limit]
            
            results = []
            for item in page_items:
                 if isinstance(item, Article):
                    data = ArticleSerializer(item, context={'request': request}).data
                    data['type'] = 'article'
                 elif isinstance(item, Quiz):
                    data = QuizSerializer(item, context={'request': request}).data
                    data['type'] = 'quiz'
                 elif isinstance(item, Poll):
                    data = PollSerializer(item, context={'request': request}).data
                    data['type'] = 'poll'

                 results.append(data)
            return Response({'results': results, 'count': count})
        
        else:
            queryset = None
            serializer_cls = None
            
            if type_param == 'quiz':
                queryset = Quiz.objects.filter(author=user).prefetch_related('questions__choices')
                if search_query: queryset = queryset.filter(title__icontains=search_query)
                serializer_cls = QuizSerializer
            
            elif type_param == 'poll':
                queryset = Poll.objects.filter(author=user).prefetch_related('options', 'votes')
                if search_query: queryset = queryset.filter(question__icontains=search_query)
                serializer_cls = PollSerializer

            else: # article
                queryset = Article.objects.filter(author=user).select_related('author', 'sub_category')
                if search_query: queryset = queryset.filter(Q(title__icontains=search_query) | Q(body__icontains=search_query))
                serializer_cls = ArticleSerializer

            queryset = queryset.annotate(
                likes_count=Count('likes', distinct=True),
                comments_count=Count('comments', distinct=True)
            ).order_by('-created_at')
            
            count = queryset.count()
            start = (page - 1) * limit
            end = start + limit
            items = queryset[start:end]
            
            data = serializer_cls(items, many=True, context={'request': request}).data
            
            # Inject Type
            for item in data:
                item['type'] = type_param
            
            return Response({'results': data, 'count': count})
