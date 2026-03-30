from rest_framework import generics, permissions
from apps.profiles.models import Project
from apps.profiles.api.serializers import ProjectSerializer

class ProjectListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user_id = self.request.query_params.get('user_id')
        if user_id:
             return Project.objects.filter(user_id=user_id).order_by('-date')
        if self.request.user.is_authenticated:
            return Project.objects.filter(user=self.request.user).order_by('-date')
        return Project.objects.none()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ProjectDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
