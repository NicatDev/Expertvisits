from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from apps.profiles.models import Service
from apps.profiles.api.serializers import ServiceSerializer


class ServiceObjectPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if not request.user.is_authenticated:
            return False
        if obj.company_id:
            return obj.company.owner_id == request.user.id
        return obj.user_id == request.user.id


class ServiceListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        company_id = self.request.query_params.get('company_id')
        user_id = self.request.query_params.get('user_id')
        if company_id:
            return Service.objects.filter(company_id=company_id).order_by('-id')
        if user_id:
            return Service.objects.filter(user_id=user_id, company__isnull=True).order_by(
                '-id'
            )
        if self.request.user.is_authenticated:
            # Default list = personal portfolio services only (company-linked use ?company_id=).
            return Service.objects.filter(
                user=self.request.user, company__isnull=True
            ).order_by('-id')
        return Service.objects.none()

    def perform_create(self, serializer):
        company = serializer.validated_data.get('company')
        if company:
            if company.owner_id != self.request.user.id:
                raise PermissionDenied('Only the company owner can add company services.')
            serializer.save(user=self.request.user, company=company)
        else:
            serializer.save(user=self.request.user, company=None)


class ServiceDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Service.objects.select_related('company', 'company__owner', 'user')
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, ServiceObjectPermission]
