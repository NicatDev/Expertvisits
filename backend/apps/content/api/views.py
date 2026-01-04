from rest_framework import viewsets, permissions, filters, generics
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.response import Response
from django.db.models import Count
from apps.content.models import Article, Quiz, Survey
from apps.content.api.serializers import ArticleSerializer, QuizSerializer, SurveySerializer
from rest_framework.decorators import action

class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.select_related('author', 'sub_category').annotate(
        likes_count=Count('likes', distinct=True),
        comments_count=Count('comments', distinct=True)
    ).all()
    serializer_class = ArticleSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    filterset_fields = ['author', 'sub_category']
    search_fields = ['title', 'body']
    ordering_fields = ['created_at', 'title']
    lookup_field = 'slug'

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.prefetch_related('questions__choices').annotate(
        likes_count=Count('likes', distinct=True),
        comments_count=Count('comments', distinct=True)
    ).all()

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        quiz = self.get_object()
        answers = request.data.get('answers', {}) # Dict of question_id: choice_id
        score = 0
        total = quiz.questions.count()
        
        for q in quiz.questions.all():
            choice_id = answers.get(str(q.id))
            if choice_id:
                correct = q.choices.filter(id=choice_id, is_correct=True).exists()
                if correct:
                    score += 1
        
        from apps.content.models import QuizAttempt
        QuizAttempt.objects.create(
            user=request.user,
            quiz=quiz,
            answers_json=answers,
            score=score
        )
        return Response({'score': score, 'total': total})
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class SurveyViewSet(viewsets.ModelViewSet):
    queryset = Survey.objects.annotate(
        likes_count=Count('likes', distinct=True),
        comments_count=Count('comments', distinct=True)
    ).all()

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        survey = self.get_object()
        answer = request.data.get('answer_text')
        
        if not answer:
             return Response({"error": "Answer text is required"}, status=400)
        
        from apps.content.models import SurveyResponse
        # Check if already participated
        if SurveyResponse.objects.filter(survey=survey, user=request.user).exists():
             return Response({"error": "Already participated"}, status=400)

        SurveyResponse.objects.create(
            user=request.user,
            survey=survey,
            answer_text=answer
        )
        return Response({"status": "submitted"})

    serializer_class = SurveySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

from django.db.models import Count, Q

class FeedView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]

    def get_serializer_class(self):
        type_param = self.request.query_params.get('type', 'article')
        if type_param == 'quiz':
            return QuizSerializer
        elif type_param == 'survey':
            return SurveySerializer
        elif type_param == 'all':
             return ArticleSerializer 
        return ArticleSerializer

    def get_queryset(self):
        type_param = self.request.query_params.get('type', 'article')
        ordering_param = self.request.query_params.get('ordering', '-created_at')
        search_query = self.request.query_params.get('search', '')

        if type_param == 'quiz':
            queryset = Quiz.objects.prefetch_related('questions__choices')
            if search_query:
                queryset = queryset.filter(title__icontains=search_query)
        elif type_param == 'survey':
            queryset = Survey.objects.all()
            if search_query:
                queryset = queryset.filter(question__icontains=search_query)
        elif type_param == 'all':
             return None 
        else: # article
            queryset = Article.objects.select_related('author', 'sub_category')
            if search_query:
                 queryset = queryset.filter(Q(title__icontains=search_query) | Q(body__icontains=search_query))

        # Annotation for Popularity (Likes)
        queryset = queryset.annotate(
            likes_count=Count('likes', distinct=True),
            comments_count=Count('comments', distinct=True) 
        )

        if ordering_param == 'popularity':
             return queryset.order_by('-likes_count', '-created_at')
        
        return queryset.order_by('-created_at')

    def list(self, request, *args, **kwargs):
        type_param = self.request.query_params.get('type', 'article')
        search_query = self.request.query_params.get('search', '')

        if type_param == 'all':
            # Combine all 3 types
            articles = Article.objects.select_related('author', 'sub_category').annotate(likes_count=Count('likes', distinct=True), comments_count=Count('comments', distinct=True))
            quizzes = Quiz.objects.prefetch_related('questions__choices').annotate(likes_count=Count('likes', distinct=True), comments_count=Count('comments', distinct=True))
            surveys = Survey.objects.all().annotate(likes_count=Count('likes', distinct=True), comments_count=Count('comments', distinct=True))
            
            if search_query:
                articles = articles.filter(Q(title__icontains=search_query) | Q(body__icontains=search_query))
                quizzes = quizzes.filter(title__icontains=search_query)
                surveys = surveys.filter(question__icontains=search_query)

            from itertools import chain
            combined = sorted(
                chain(articles, quizzes, surveys),
                key=lambda instance: instance.created_at,
                reverse=True
            )
            
            # Simple pagination slice
            try:
                page_size = int(request.query_params.get('limit', 10))
            except (ValueError, TypeError):
                page_size = 10
                
            page_num = int(request.query_params.get('page', 1))
            start = (page_num - 1) * page_size
            end = start + page_size
            page_items = combined[start:end]
            
            # Serialize individually
            results = []
            for item in page_items:
                if isinstance(item, Article):
                    results.append(ArticleSerializer(item, context={'request': request}).data)
                elif isinstance(item, Quiz):
                    results.append(QuizSerializer(item, context={'request': request}).data)
                elif isinstance(item, Survey):
                    results.append(SurveySerializer(item, context={'request': request}).data)
            
            return Response({'results': results, 'count': len(combined)}) # Simplified pagination

        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response({'results': serializer.data})

class UserFeedView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        type_param = self.request.query_params.get('type', 'all')
        if type_param == 'quiz':
            return QuizSerializer
        elif type_param == 'survey':
            return SurveySerializer
        elif type_param == 'all':
             return ArticleSerializer 
        return ArticleSerializer

    def get_queryset(self):
        type_param = self.request.query_params.get('type', 'all')
        search_query = self.request.query_params.get('search', '')
        user = self.request.user

        if type_param == 'quiz':
            queryset = Quiz.objects.filter(author=user).prefetch_related('questions__choices')
            if search_query:
                queryset = queryset.filter(title__icontains=search_query)
        elif type_param == 'survey':
            queryset = Survey.objects.filter(author=user)
            if search_query:
                queryset = queryset.filter(question__icontains=search_query)
        elif type_param == 'all':
             return None 
        else: # article
            queryset = Article.objects.filter(author=user).select_related('author', 'sub_category')
            if search_query:
                 queryset = queryset.filter(Q(title__icontains=search_query) | Q(body__icontains=search_query))

        # Annotation for Popularity (Likes)
        queryset = queryset.annotate(
            likes_count=Count('likes', distinct=True),
            comments_count=Count('comments', distinct=True) 
        )
        
        return queryset.order_by('-created_at')

    def list(self, request, *args, **kwargs):
        type_param = self.request.query_params.get('type', 'all')
        search_query = self.request.query_params.get('search', '')
        user = self.request.user

        if type_param == 'all':
            # Combine all 3 types
            articles = Article.objects.filter(author=user).select_related('author', 'sub_category').annotate(likes_count=Count('likes', distinct=True), comments_count=Count('comments', distinct=True))
            quizzes = Quiz.objects.filter(author=user).prefetch_related('questions__choices').annotate(likes_count=Count('likes', distinct=True), comments_count=Count('comments', distinct=True))
            surveys = Survey.objects.filter(author=user).annotate(likes_count=Count('likes', distinct=True), comments_count=Count('comments', distinct=True))
            
            if search_query:
                articles = articles.filter(Q(title__icontains=search_query) | Q(body__icontains=search_query))
                quizzes = quizzes.filter(title__icontains=search_query)
                surveys = surveys.filter(question__icontains=search_query)

            from itertools import chain
            combined = sorted(
                chain(articles, quizzes, surveys),
                key=lambda instance: instance.created_at,
                reverse=True
            )
            
            # Simple pagination slice
            page_size = int(request.query_params.get('limit', 3)) # Default 3 as requested
            page_num = int(request.query_params.get('page', 1))
            start = (page_num - 1) * page_size
            end = start + page_size
            page_items = combined[start:end]
            
            # Serialize individually
            results = []
            for item in page_items:
                # Basic Type Check
                if isinstance(item, Article):
                    data = ArticleSerializer(item, context={'request': request}).data
                    data['type'] = 'article' # Ensure type is present
                elif isinstance(item, Quiz):
                    data = QuizSerializer(item, context={'request': request}).data
                    data['type'] = 'quiz'
                elif isinstance(item, Survey):
                    data = SurveySerializer(item, context={'request': request}).data
                    data['type'] = 'survey'
                results.append(data)
            
            return Response({'results': results, 'count': len(combined)}) 

        queryset = self.get_queryset()
        
        # Manual Pagination for single types to match structure if needed, or use DRF standard
        # But for consistency let's use the slice approach or DRF. 
        # Using DRF standard pagination here but overriding page_size might be needed if not set globally?
        # Let's manual slice to keep consistency with "all" block above regarding limit param
        
        # Determine limit
        limit_param = request.query_params.get('limit', 3)
        try:
             page_size = int(limit_param)
        except:
             page_size = 3
             
        page_num = int(request.query_params.get('page', 1))
        
        start = (page_num - 1) * page_size
        end = start + page_size
        
        # We need to list() the queryset to slice if we want consistent behavior or just use Django slicing
        count = queryset.count()
        page_items = queryset[start:end]
        
        serializer = self.get_serializer(page_items, many=True)
        data = serializer.data
        
        # Inject type
        for item in data:
            if type_param == 'quiz': item['type'] = 'quiz'
            elif type_param == 'survey': item['type'] = 'survey'
            else: item['type'] = 'article'

        return Response({'results': data, 'count': count})

class PublicFeedView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]

    def get_serializer_class(self):
        type_param = self.request.query_params.get('type', 'all')
        if type_param == 'quiz':
            return QuizSerializer
        elif type_param == 'survey':
            return SurveySerializer
        elif type_param == 'all':
             return ArticleSerializer 
        return ArticleSerializer

    def get_queryset(self):
        type_param = self.request.query_params.get('type', 'all')
        search_query = self.request.query_params.get('search', '')
        user_id = self.request.query_params.get('user_id')

        if not user_id:
            return Article.objects.none()

        if type_param == 'quiz':
            queryset = Quiz.objects.filter(author_id=user_id).prefetch_related('questions__choices')
            if search_query:
                queryset = queryset.filter(title__icontains=search_query)
        elif type_param == 'survey':
            queryset = Survey.objects.filter(author_id=user_id)
            if search_query:
                queryset = queryset.filter(question__icontains=search_query)
        elif type_param == 'all':
             return None 
        else: # article
            queryset = Article.objects.filter(author_id=user_id).select_related('author', 'sub_category')
            if search_query:
                 queryset = queryset.filter(Q(title__icontains=search_query) | Q(body__icontains=search_query))

        # Annotation for Popularity (Likes)
        queryset = queryset.annotate(
            likes_count=Count('likes', distinct=True),
            comments_count=Count('comments', distinct=True) 
        )
        
        return queryset.order_by('-created_at')

    def list(self, request, *args, **kwargs):
        type_param = self.request.query_params.get('type', 'all')
        search_query = self.request.query_params.get('search', '')
        user_id = self.request.query_params.get('user_id')
        
        if not user_id:
             return Response({'results': [], 'count': 0})

        if type_param == 'all':
            # Combine all 3 types
            articles = Article.objects.filter(author_id=user_id).select_related('author', 'sub_category').annotate(likes_count=Count('likes', distinct=True), comments_count=Count('comments', distinct=True))
            quizzes = Quiz.objects.filter(author_id=user_id).prefetch_related('questions__choices').annotate(likes_count=Count('likes', distinct=True), comments_count=Count('comments', distinct=True))
            surveys = Survey.objects.filter(author_id=user_id).annotate(likes_count=Count('likes', distinct=True), comments_count=Count('comments', distinct=True))
            
            if search_query:
                articles = articles.filter(Q(title__icontains=search_query) | Q(body__icontains=search_query))
                quizzes = quizzes.filter(title__icontains=search_query)
                surveys = surveys.filter(question__icontains=search_query)

            from itertools import chain
            combined = sorted(
                chain(articles, quizzes, surveys),
                key=lambda instance: instance.created_at,
                reverse=True
            )
            
            # Simple pagination slice
            page_size = int(request.query_params.get('limit', 3)) 
            page_num = int(request.query_params.get('page', 1))
            start = (page_num - 1) * page_size
            end = start + page_size
            page_items = combined[start:end]
            
            # Serialize individually
            results = []
            for item in page_items:
                if isinstance(item, Article):
                    data = ArticleSerializer(item, context={'request': request}).data
                    data['type'] = 'article'
                elif isinstance(item, Quiz):
                    data = QuizSerializer(item, context={'request': request}).data
                    data['type'] = 'quiz'
                elif isinstance(item, Survey):
                    data = SurveySerializer(item, context={'request': request}).data
                    data['type'] = 'survey'
                results.append(data)
            
            return Response({'results': results, 'count': len(combined)}) 

        queryset = self.get_queryset()
        
        limit_param = request.query_params.get('limit', 3)
        try:
             page_size = int(limit_param)
        except:
             page_size = 3
             
        page_num = int(request.query_params.get('page', 1))
        start = (page_num - 1) * page_size
        end = start + page_size
        
        count = queryset.count()
        page_items = queryset[start:end]
        
        serializer = self.get_serializer(page_items, many=True)
        data = serializer.data
        
        for item in data:
            if type_param == 'quiz': item['type'] = 'quiz'
            elif type_param == 'survey': item['type'] = 'survey'
            else: item['type'] = 'article'

        return Response({'results': data, 'count': count})

from rest_framework.views import APIView

class ArticleStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = Article.objects.filter(author=request.user).count()
        return Response({'count': count})
