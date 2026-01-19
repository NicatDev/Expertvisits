from rest_framework import generics, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.pagination import PageNumberPagination
from apps.business.models import Company
from apps.business.api.serializers import CompanySerializer

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class CompanyListCreateAPIView(generics.ListCreateAPIView):
    queryset = Company.objects.select_related(
        'owner', 'who_we_are', 'what_we_do', 'our_values'
    ).prefetch_related('services').order_by('-founded_at')
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    filterset_fields = ['company_size']
    search_fields = ['name', 'summary', 'services__title']

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class CompanyDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Company.objects.select_related(
        'owner', 'who_we_are', 'what_we_do', 'our_values'
    ).prefetch_related('services')
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'
