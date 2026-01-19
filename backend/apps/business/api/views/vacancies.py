from rest_framework import generics, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Exists, OuterRef, Value, BooleanField, Q
from apps.business.models import Vacancy, VacancyApplication
from apps.business.api.serializers import VacancySerializer, VacancyApplicationSerializer
from .companies import StandardResultsSetPagination

class VacancyListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = VacancySerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['title', 'company__name', 'location', 'description']
    filterset_fields = ['listing_type', 'job_type', 'work_mode', 'company', 'location']
    ordering_fields = ['posted_at', 'expires_at']

    def get_queryset(self):
        queryset = Vacancy.objects.select_related(
            'company', 'company__owner', 'company__who_we_are', 'company__what_we_do', 'company__our_values', 'sub_category'
        ).prefetch_related('company__services').order_by('-posted_at')
        if self.request.user.is_authenticated:
            queryset = queryset.annotate(
                is_applied=Exists(
                    VacancyApplication.objects.filter(
                        vacancy=OuterRef('pk'),
                        applicant=self.request.user
                    )
                )
            )
        else:
             queryset = queryset.annotate(is_applied=Value(False, output_field=BooleanField()))
        return queryset

    def perform_create(self, serializer):
        company = serializer.validated_data.get('company')
        if company.owner != self.request.user:
            raise permissions.PermissionDenied("You can only post vacancies for companies you own.")
        serializer.save(posted_by=self.request.user)


class VacancyDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = VacancySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'

    def get_queryset(self):
        # Allow detail view to access same annotated queryset
        queryset = Vacancy.objects.select_related(
            'company', 'company__owner', 'company__who_we_are', 'company__what_we_do', 'company__our_values', 'sub_category'
        ).prefetch_related('company__services')
        if self.request.user.is_authenticated:
            queryset = queryset.annotate(
                is_applied=Exists(
                    VacancyApplication.objects.filter(
                        vacancy=OuterRef('pk'),
                        applicant=self.request.user
                    )
                )
            )
        else:
             queryset = queryset.annotate(is_applied=Value(False, output_field=BooleanField()))
        return queryset

    def get_object(self):
        try:
            return super().get_object()
        except:
             # Fallback to ID
            lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
            lookup_value = self.kwargs.get(lookup_url_kwarg)
            if lookup_value and str(lookup_value).isdigit():
                queryset = self.filter_queryset(self.get_queryset())
                obj = queryset.filter(pk=lookup_value).first()
                if obj:
                    self.check_object_permissions(self.request, obj)
                    return obj
            raise

class MyVacanciesAPIView(generics.ListAPIView):
    serializer_class = VacancySerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Vacancy.objects.filter(
            Q(company__owner=self.request.user) | Q(posted_by=self.request.user)
        ).select_related(
            'company', 'company__owner', 'company__who_we_are', 'company__what_we_do', 'company__our_values', 'sub_category'
        ).prefetch_related('company__services').order_by('-posted_at')

class VacancyApplicantsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, slug=None):
        # Slug can be slug or ID
        if slug and str(slug).isdigit():
             vacancy = Vacancy.objects.filter(pk=int(slug)).select_related('company').first()
        else:
             vacancy = Vacancy.objects.filter(slug=slug).select_related('company').first()

        if not vacancy:
             return Response([]) # Or 404

        if vacancy.company.owner != request.user and vacancy.posted_by != request.user:
             return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        
        applications = VacancyApplication.objects.filter(vacancy=vacancy).select_related('applicant')
        serializer = VacancyApplicationSerializer(applications, many=True, context={'request': request})
        return Response(serializer.data)

class VacancyCheckAppliedAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug=None):
        if not request.user.is_authenticated:
            return Response({'applied': False})
        
        if slug and str(slug).isdigit():
             vacancy = Vacancy.objects.filter(pk=int(slug)).first()
        else:
             vacancy = Vacancy.objects.filter(slug=slug).first()
             
        if not vacancy:
             return Response({'applied': False}, status=status.HTTP_404_NOT_FOUND)

        applied = VacancyApplication.objects.filter(vacancy=vacancy, applicant=request.user).exists()
        return Response({'applied': applied})
