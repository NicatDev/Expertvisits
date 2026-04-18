from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from apps.profiles.models import Project
from apps.profiles.api.serializers import ProjectSerializer


class ProjectListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user_id = self.request.query_params.get('user_id')
        company_id = self.request.query_params.get('company_id')
        qs = Project.objects.select_related('user', 'company')
        if company_id:
            return qs.filter(company_id=company_id).order_by('-date')
        if user_id:
            return qs.filter(user_id=user_id, company__isnull=True).order_by('-date')
        if self.request.user.is_authenticated:
            return qs.filter(user=self.request.user).order_by('-date')
        return Project.objects.none()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ProjectDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Project.objects.select_related('user', 'company')
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _ensure_can_mutate(self, project):
        user = self.request.user
        if not user.is_authenticated:
            raise PermissionDenied('Authentication required.')
        if project.company_id:
            if project.company.owner_id != user.id:
                raise PermissionDenied('You can only edit projects for companies you own.')
        elif project.user_id != user.id:
            raise PermissionDenied('You can only edit your own projects.')

    def perform_update(self, serializer):
        self._ensure_can_mutate(serializer.instance)
        serializer.save()

    def perform_destroy(self, instance):
        self._ensure_can_mutate(instance)
        instance.delete()
