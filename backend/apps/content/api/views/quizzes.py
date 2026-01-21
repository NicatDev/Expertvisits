from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count
from apps.content.models import Quiz, QuizAttempt
from apps.content.api.serializers import QuizSerializer

class QuizListCreateAPIView(generics.ListCreateAPIView):
    queryset = Quiz.objects.select_related('author').prefetch_related('questions__choices').annotate(
        likes_count=Count('likes', distinct=True),
        comments_count=Count('comments', distinct=True)
    ).order_by('-created_at')
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class QuizDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Quiz.objects.select_related('author').prefetch_related('questions__choices').annotate(
        likes_count=Count('likes', distinct=True),
        comments_count=Count('comments', distinct=True)
    )
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class QuizSubmitAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk=None):
        try:
            quiz = Quiz.objects.select_related('author').prefetch_related('questions__choices').get(pk=pk)
        except Quiz.DoesNotExist:
            return Response({'error': 'Quiz not found'}, status=status.HTTP_404_NOT_FOUND)

        answers = request.data.get('answers', {}) # Dict of question_id: choice_id
        score = 0
        total = quiz.questions.count()
        
        for q in quiz.questions.all():
            choice_id = answers.get(str(q.id))
            if choice_id:
                # Optimized check: we could map choices in memory, but exists() is ok if small count. 
                # Better: get all correct choices ids list for these questions.
                pass 
                # Keeping original logic for safety, but using existing queryset
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

from apps.content.api.serializers import QuizReviewSerializer, QuizAttemptSerializer

class QuizResultAPIView(APIView):
    """
    Get the current user's result for a specific quiz.
    Returns the full quiz with correct answers + user's attempt data.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk=None):
        try:
            quiz = Quiz.objects.prefetch_related('questions__choices').get(pk=pk)
        except Quiz.DoesNotExist:
            return Response({'error': 'Quiz not found'}, status=status.HTTP_404_NOT_FOUND)

        # Check if user has attempted
        attempt = QuizAttempt.objects.filter(user=request.user, quiz=quiz).last()
        if not attempt:
             return Response({'error': 'No attempt found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = QuizReviewSerializer(quiz, context={'attempt': attempt})
        return Response(serializer.data)


class QuizParticipantsAPIView(generics.ListAPIView):
    """
    Get list of participants for a quiz (Author only).
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = QuizAttemptSerializer

    def get_queryset(self):
        quiz_id = self.kwargs.get('pk')
        try:
            quiz = Quiz.objects.get(id=quiz_id)
        except Quiz.DoesNotExist:
            return QuizAttempt.objects.none()
        
        # Security check: only author can view participants
        if quiz.author != self.request.user:
            return QuizAttempt.objects.none()

        return QuizAttempt.objects.filter(quiz=quiz).select_related('user').order_by('-created_at')

    def list(self, request, *args, **kwargs):
        # Override to handle permission error more gracefully if needed, 
        # or relying on get_queryset returning empty. 
        # Better: check permission explicitly.
        quiz_id = self.kwargs.get('pk')
        try:
            quiz = Quiz.objects.get(id=quiz_id)
            if quiz.author != request.user:
                 return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        except Quiz.DoesNotExist:
             return Response({'error': 'Quiz not found'}, status=status.HTTP_404_NOT_FOUND)
             
        return super().list(request, *args, **kwargs)


class QuizParticipantDetailAPIView(APIView):
    """
    Get specific participant's result (Author only).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk=None, user_id=None):
        try:
            quiz = Quiz.objects.prefetch_related('questions__choices').get(pk=pk)
        except Quiz.DoesNotExist:
            return Response({'error': 'Quiz not found'}, status=status.HTTP_404_NOT_FOUND)
            
        if quiz.author != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        attempt = QuizAttempt.objects.filter(quiz=quiz, user_id=user_id).last()
        if not attempt:
            return Response({'error': 'Attempt not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = QuizReviewSerializer(quiz, context={'attempt': attempt})
        return Response(serializer.data)
