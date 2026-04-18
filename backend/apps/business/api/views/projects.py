from rest_framework import generics, permissions
from apps.business.models import OngoingProject
from apps.business.api.serializers import OngoingProjectSerializer

class ProjectListCreateAPIView(generics.ListCreateAPIView):
    queryset = OngoingProject.objects.select_related('creator').prefetch_related('participants')
    serializer_class = OngoingProjectSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

class ProjectDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = OngoingProject.objects.select_related('creator').prefetch_related('participants')
    serializer_class = OngoingProjectSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
