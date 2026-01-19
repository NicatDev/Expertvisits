from rest_framework import generics, permissions
from apps.profiles.models import Experience
from apps.profiles.api.serializers import ExperienceSerializer

class ExperienceListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = ExperienceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        user_id = self.request.query_params.get('user_id')
        if user_id:
             return Experience.objects.filter(user_id=user_id).order_by('-start_date')
        if self.request.user.is_authenticated:
            return Experience.objects.filter(user=self.request.user).order_by('-start_date')
        return Experience.objects.none()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ExperienceDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Experience.objects.all()
    serializer_class = ExperienceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
