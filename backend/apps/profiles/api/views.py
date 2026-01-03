from rest_framework import viewsets, permissions
from apps.profiles.models import Experience, Education, Skill, QuickNote, Language, Certificate
from apps.profiles.api.serializers import ExperienceSerializer, EducationSerializer, SkillSerializer, QuickNoteSerializer, LanguageSerializer, CertificateSerializer

class BaseProfileViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user_id = self.request.query_params.get('user_id')
        if user_id:
             return self.queryset.filter(user_id=user_id)
        # Default to current user's items for editing, or empty?
        # If no user_id and authenticated, return own items?
        if self.request.user.is_authenticated:
            return self.queryset.filter(user=self.request.user)
        return self.queryset.none()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ExperienceViewSet(BaseProfileViewSet):
    queryset = Experience.objects.all()
    serializer_class = ExperienceSerializer

class EducationViewSet(BaseProfileViewSet):
    queryset = Education.objects.all()
    serializer_class = EducationSerializer

class SkillViewSet(BaseProfileViewSet):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer

class QuickNoteViewSet(BaseProfileViewSet):
    queryset = QuickNote.objects.all()
    serializer_class = QuickNoteSerializer

class LanguageViewSet(BaseProfileViewSet):
    queryset = Language.objects.all()
    serializer_class = LanguageSerializer

class CertificateViewSet(BaseProfileViewSet):
    queryset = Certificate.objects.all()
    serializer_class = CertificateSerializer
