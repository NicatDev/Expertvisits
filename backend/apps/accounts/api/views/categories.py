from rest_framework import generics, permissions
from apps.accounts.models import Category
from apps.accounts.api.serializers import CategorySerializer

class CategoryListAPIView(generics.ListAPIView):
    queryset = Category.objects.all().prefetch_related('subcategories')
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

class CategoryDetailAPIView(generics.RetrieveAPIView):
    queryset = Category.objects.all().prefetch_related('subcategories')
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
