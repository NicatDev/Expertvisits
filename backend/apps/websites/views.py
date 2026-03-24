from rest_framework import generics
from rest_framework.permissions import AllowAny
from apps.websites.models import UserWebsite
from .serializers import UserWebsiteSerializer

class UserWebsitePublicDetailView(generics.RetrieveAPIView):
    queryset = UserWebsite.objects.select_related('user').all()
    serializer_class = UserWebsiteSerializer
    permission_classes = [AllowAny]
    lookup_field = 'user__username'
    lookup_url_kwarg = 'username'
