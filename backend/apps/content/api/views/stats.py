from rest_framework.views import APIView
from rest_framework import permissions
from rest_framework.response import Response
from apps.content.models import Article

class ArticleStatsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = Article.objects.filter(author=request.user).count()
        return Response({'count': count})
