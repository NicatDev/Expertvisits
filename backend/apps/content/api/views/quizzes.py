from django.shortcuts import get_object_or_404
from django.db.models import Count
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.content.models import Quiz, QuizAttempt
from apps.content.api.serializers import (
    QuizSerializer,
    QuizDetailSerializer,
    QuizReviewSerializer,
    QuizAttemptSerializer,
)

class QuizListCreateAPIView(generics.ListCreateAPIView):
    queryset = Quiz.objects.select_related('author', 'sub_category').prefetch_related('questions__choices').annotate(
        likes_count=Count('likes', distinct=True),
        comments_count=Count('comments', distinct=True)
    ).order_by('-created_at')
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(
            author=self.request.user,
            sub_category=getattr(self.request.user, 'profession_sub_category', None),
        )

class QuizDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Quiz.objects.select_related('author', 'sub_category').prefetch_related('questions__choices').annotate(
        likes_count=Count('likes', distinct=True),
        comments_count=Count('comments', distinct=True)
    )
    lookup_field = 'slug'
    lookup_url_kwarg = 'slug'
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return QuizDetailSerializer
        return QuizSerializer

    def retrieve(self, request, *args, **kwargs):
        """?omit=detail — SSR/metadata üçün yüngül cavab (stats və my_attempts olmadan)."""
        instance = self.get_object()
        omit = request.query_params.get('omit', '')
        parts = {p.strip() for p in omit.split(',') if p.strip()}
        if request.method == 'GET' and 'detail' in parts:
            serializer = QuizSerializer(instance, context={'request': request})
        else:
            serializer = QuizDetailSerializer(instance, context={'request': request})
        return Response(serializer.data)

    def perform_update(self, serializer):
        serializer.save(
            sub_category=getattr(self.request.user, 'profession_sub_category', None),
        )

class QuizSubmitAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug=None):
        quiz = get_object_or_404(
            Quiz.objects.select_related('author').prefetch_related('questions__choices'),
            slug=slug,
        )

        answers = request.data.get('answers', {})
        score = 0
        total = quiz.questions.count()

        for q in quiz.questions.all():
            choice_id = answers.get(str(q.id))
            if choice_id:
                correct = q.choices.filter(id=choice_id, is_correct=True).exists()
                if correct:
                    score += 1

        QuizAttempt.objects.create(
            user=request.user,
            quiz=quiz,
            answers_json=answers,
            score=score
        )
        return Response({'score': score, 'total': total})

class QuizResultAPIView(APIView):
    """
    Current user's review for a quiz. Optional ?attempt_id= for a specific attempt (default: latest).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, slug=None):
        quiz = get_object_or_404(
            Quiz.objects.prefetch_related('questions__choices'),
            slug=slug,
        )

        attempt_qs = QuizAttempt.objects.filter(user=request.user, quiz=quiz)
        attempt_id = request.query_params.get('attempt_id')
        if attempt_id:
            attempt = attempt_qs.filter(id=attempt_id).first()
        else:
            attempt = attempt_qs.order_by('-created_at').first()

        if not attempt:
            return Response({'error': 'No attempt found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = QuizReviewSerializer(quiz, context={'attempt': attempt})
        return Response(serializer.data)


class QuizMyAttemptsAPIView(APIView):
    """List current user's attempts for this quiz (newest first)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, slug=None):
        quiz = get_object_or_404(Quiz, slug=slug)
        attempts = QuizAttempt.objects.filter(quiz=quiz, user=request.user).order_by('-created_at')
        serializer = QuizAttemptSerializer(attempts, many=True)
        return Response(serializer.data)


class QuizParticipantsAPIView(generics.ListAPIView):
    """
    Get list of attempts for a quiz (Author only).
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = QuizAttemptSerializer

    def get_queryset(self):
        slug = self.kwargs.get('slug')
        try:
            quiz = Quiz.objects.get(slug=slug)
        except Quiz.DoesNotExist:
            return QuizAttempt.objects.none()

        if quiz.author != self.request.user:
            return QuizAttempt.objects.none()

        return QuizAttempt.objects.filter(quiz=quiz).select_related('user').order_by('-created_at')

    def list(self, request, *args, **kwargs):
        slug = self.kwargs.get('slug')
        try:
            quiz = Quiz.objects.get(slug=slug)
            if quiz.author != request.user:
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        except Quiz.DoesNotExist:
            return Response({'error': 'Quiz not found'}, status=status.HTTP_404_NOT_FOUND)

        return super().list(request, *args, **kwargs)


class QuizParticipantDetailAPIView(APIView):
    """
    Get specific participant's latest attempt (Author only). Use participants list for each attempt row.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, slug=None, user_id=None):
        quiz = get_object_or_404(
            Quiz.objects.prefetch_related('questions__choices'),
            slug=slug,
        )

        if quiz.author != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        attempt = QuizAttempt.objects.filter(quiz=quiz, user_id=user_id).order_by('-created_at').first()
        if not attempt:
            return Response({'error': 'Attempt not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = QuizReviewSerializer(quiz, context={'attempt': attempt})
        return Response(serializer.data)
