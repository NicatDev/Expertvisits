from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count
from apps.content.models import Survey, SurveyResponse
from apps.content.api.serializers import SurveySerializer

class SurveyListCreateAPIView(generics.ListCreateAPIView):
    queryset = Survey.objects.annotate(
        likes_count=Count('likes', distinct=True),
        comments_count=Count('comments', distinct=True)
    ).all()
    serializer_class = SurveySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class SurveyDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Survey.objects.annotate(
        likes_count=Count('likes', distinct=True),
        comments_count=Count('comments', distinct=True)
    ).all()
    serializer_class = SurveySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class SurveySubmitAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk=None):
        try:
            survey = Survey.objects.get(pk=pk)
        except Survey.DoesNotExist:
            return Response({'error': 'Survey not found'}, status=status.HTTP_404_NOT_FOUND)
            
        answer = request.data.get('answer_text')
        
        if not answer:
             return Response({"error": "Answer text is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if already participated
        if SurveyResponse.objects.filter(survey=survey, user=request.user).exists():
             return Response({"error": "Already participated"}, status=status.HTTP_400_BAD_REQUEST)

        SurveyResponse.objects.create(
            user=request.user,
            survey=survey,
            answer_text=answer
        )
        return Response({"status": "submitted"})
