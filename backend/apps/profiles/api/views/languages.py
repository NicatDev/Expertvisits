from rest_framework import generics, permissions
from apps.profiles.models import Language
from apps.profiles.api.serializers import LanguageSerializer

class LanguageListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = LanguageSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        user_id = self.request.query_params.get('user_id')
        if user_id:
             return Language.objects.filter(user_id=user_id)
        if self.request.user.is_authenticated:
            return Language.objects.filter(user=self.request.user)
        return Language.objects.none()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class LanguageDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Language.objects.all()
    serializer_class = LanguageSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
