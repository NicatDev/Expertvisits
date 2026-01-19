from rest_framework import generics, permissions
from apps.profiles.models import Education
from apps.profiles.api.serializers import EducationSerializer

class EducationListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = EducationSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        user_id = self.request.query_params.get('user_id')
        if user_id:
             return Education.objects.filter(user_id=user_id).order_by('-start_date')
        if self.request.user.is_authenticated:
            return Education.objects.filter(user=self.request.user).order_by('-start_date')
        return Education.objects.none()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class EducationDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Education.objects.all()
    serializer_class = EducationSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
