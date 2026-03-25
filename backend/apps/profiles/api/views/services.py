from rest_framework import generics, permissions
from apps.profiles.models import Service
from apps.profiles.api.serializers import ServiceSerializer

class ServiceListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user_id = self.request.query_params.get('user_id')
        if user_id:
             return Service.objects.filter(user_id=user_id).order_by('-id')
        if self.request.user.is_authenticated:
            return Service.objects.filter(user=self.request.user).order_by('-id')
        return Service.objects.none()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ServiceDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
