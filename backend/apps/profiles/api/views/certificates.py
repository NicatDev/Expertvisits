from rest_framework import generics, permissions
from apps.profiles.models import Certificate
from apps.profiles.api.serializers import CertificateSerializer

class CertificateListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = CertificateSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        user_id = self.request.query_params.get('user_id')
        if user_id:
             return Certificate.objects.filter(user_id=user_id)
        if self.request.user.is_authenticated:
            return Certificate.objects.filter(user=self.request.user)
        return Certificate.objects.none()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class CertificateDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Certificate.objects.all()
    serializer_class = CertificateSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
