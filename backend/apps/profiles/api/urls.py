from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.profiles.api.views import ExperienceViewSet, EducationViewSet, SkillViewSet, QuickNoteViewSet, LanguageViewSet, CertificateViewSet

router = DefaultRouter()
router.register(r'experience', ExperienceViewSet, basename='experience')
router.register(r'education', EducationViewSet, basename='education')
router.register(r'skills', SkillViewSet, basename='skills')
router.register(r'notes', QuickNoteViewSet, basename='notes')
router.register(r'languages', LanguageViewSet, basename='languages')
router.register(r'certificates', CertificateViewSet, basename='certificates')

urlpatterns = [
    path('', include(router.urls)),
]
