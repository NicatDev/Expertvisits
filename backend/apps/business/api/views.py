from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from apps.business.models import Company, Vacancy, OngoingProject, VacancyApplication
from apps.business.api.serializers import CompanySerializer, VacancySerializer, ProjectSerializer, VacancyApplicationSerializer

class VacancyApplicationViewSet(viewsets.ModelViewSet):
    queryset = VacancyApplication.objects.all()
    serializer_class = VacancyApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users can see their own applications
        # vacancy owners can see applications to their vacancies (handled via vacancy/<id>/applicants mostly, but here too)
        user = self.request.user
        if self.action == 'list':
             # Return my applications
             return VacancyApplication.objects.filter(applicant=user)
        return super().get_queryset()

    def perform_create(self, serializer):
        # Validate uniqueness
        vacancy = serializer.validated_data['vacancy']
        if VacancyApplication.objects.filter(vacancy=vacancy, applicant=self.request.user).exists():
            raise serializers.ValidationError("You have already applied to this vacancy.")
        serializer.save(applicant=self.request.user)

    @action(detail=True, methods=['post'])
    def set_status(self, request, pk=None):
        application = self.get_object()
        # Only vacancy owner or poster can change status
        if application.vacancy.company.owner != request.user and application.vacancy.posted_by != request.user:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        
        new_status = request.data.get('status')
        if new_status not in ['accepted', 'rejected', 'pending']:
            return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)
        
        application.status = new_status
        application.save()
        return Response({'status': 'updated'})

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
    
    # Optional: Owner-specific query if needed
    # def get_queryset(self):
    #     user = self.request.user
    #     if user.is_authenticated and self.action == 'list' and 'my' in self.request.query_params:
    #         return Company.objects.filter(owner=user)
    #     return super().get_queryset()

class VacancyViewSet(viewsets.ModelViewSet):
    queryset = Vacancy.objects.select_related('company', 'sub_category').order_by('-posted_at')
    serializer_class = VacancySerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['title', 'company__name', 'location']
    filterset_fields = ['listing_type', 'job_type', 'work_mode', 'company']
    ordering_fields = ['posted_at', 'expires_at']
    lookup_field = 'slug'

    def get_object(self):
        # Try default lookup (slug)
        try:
            return super().get_object()
        except:
            # Fallback to ID if lookup_url_kwarg (which defaults to lookup_field i.e. slug) is numeric
            lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
            lookup_value = self.kwargs.get(lookup_url_kwarg)
            
            if lookup_value and str(lookup_value).isdigit():
                obj = self.get_queryset().filter(pk=lookup_value).first()
                if obj:
                    self.check_object_permissions(self.request, obj)
                    return obj
            raise

    def get_queryset(self):
        from django.db.models import Exists, OuterRef, Value, BooleanField
        queryset = Vacancy.objects.select_related('company', 'sub_category').order_by('-posted_at')
        
        # When accessing detail, we don't necessarily need is_applied, but it's fine.
        # Ensure we don't filter out things accidentally. 
        # But wait, original get_queryset has annotation logic. preserving it.
        
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
        # Ensure user owns the company
        # company = serializer.validated_data.get('company') 
        # But user explicitly wants to track who posted it even if they dont own the company.
        serializer.save(posted_by=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_vacancies(self, request):
        """ Return vacancies where company owner is current user OR posted by current user """
        from django.db.models import Q
        vacancies = Vacancy.objects.filter(
            Q(company__owner=request.user) | Q(posted_by=request.user)
        ).order_by('-posted_at')
        page = self.paginate_queryset(vacancies)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(vacancies, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_vacancies(self, request):
        """ Return vacancies where company owner is current user OR posted by current user """
        from django.db.models import Q
        vacancies = Vacancy.objects.filter(
            Q(company__owner=request.user) | Q(posted_by=request.user)
        ).order_by('-posted_at')
        page = self.paginate_queryset(vacancies)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(vacancies, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def applicants(self, request, slug=None):
        """ Return applications for this vacancy """
        try:
            vacancy = self.get_object()
        except:
            # Fallback: Try to get by ID if slug is numeric
            if slug and str(slug).isdigit():
                try:
                    vacancy = Vacancy.objects.get(pk=int(slug))
                except Vacancy.DoesNotExist:
                    return Response([])
            else:
                 return Response([])
             
        if vacancy.company.owner != request.user and vacancy.posted_by != request.user:
             return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        
        applications = VacancyApplication.objects.filter(vacancy=vacancy)
        if not applications.exists():
            return Response([])
        serializer = VacancyApplicationSerializer(applications, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def check_applied(self, request, slug=None):
        """ Check if current user applied """
        if not request.user.is_authenticated:
            return Response({'applied': False})
        # Use get_object() to ensure 404 if vacancy not found, and robust lookup
        try:
            vacancy = self.get_object()
        except:
             return Response({'applied': False}, status=status.HTTP_404_NOT_FOUND)

        applied = VacancyApplication.objects.filter(vacancy=vacancy, applicant=request.user).exists()
        return Response({'applied': applied})

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = OngoingProject.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)
