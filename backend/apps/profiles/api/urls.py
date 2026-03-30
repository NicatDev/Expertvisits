from django.urls import path
from .views.experience import ExperienceListCreateAPIView, ExperienceDetailAPIView
from .views.education import EducationListCreateAPIView, EducationDetailAPIView
from .views.skills import SkillListCreateAPIView, SkillDetailAPIView
from .views.notes import QuickNoteListCreateAPIView, QuickNoteDetailAPIView
from .views.languages import LanguageListCreateAPIView, LanguageDetailAPIView
from .views.certificates import CertificateListCreateAPIView, CertificateDetailAPIView
from .views.services import ServiceListCreateAPIView, ServiceDetailAPIView
from .views.projects import ProjectListCreateAPIView, ProjectDetailAPIView

urlpatterns = [
    path('experience/', ExperienceListCreateAPIView.as_view(), name='experience-list-create'),
    path('experience/<int:pk>/', ExperienceDetailAPIView.as_view(), name='experience-detail'),
    
    path('education/', EducationListCreateAPIView.as_view(), name='education-list-create'),
    path('education/<int:pk>/', EducationDetailAPIView.as_view(), name='education-detail'),
    
    path('skills/', SkillListCreateAPIView.as_view(), name='skill-list-create'),
    path('skills/<int:pk>/', SkillDetailAPIView.as_view(), name='skill-detail'),
    
    path('notes/', QuickNoteListCreateAPIView.as_view(), name='note-list-create'),
    path('notes/<int:pk>/', QuickNoteDetailAPIView.as_view(), name='note-detail'),
    
    path('languages/', LanguageListCreateAPIView.as_view(), name='language-list-create'),
    path('languages/<int:pk>/', LanguageDetailAPIView.as_view(), name='language-detail'),
    
    path('certificates/', CertificateListCreateAPIView.as_view(), name='certificate-list-create'),
    path('certificates/<int:pk>/', CertificateDetailAPIView.as_view(), name='certificate-detail'),
    
    path('services/', ServiceListCreateAPIView.as_view(), name='service-list-create'),
    path('services/<int:pk>/', ServiceDetailAPIView.as_view(), name='service-detail'),

    path('projects/', ProjectListCreateAPIView.as_view(), name='project-list-create'),
    path('projects/<int:pk>/', ProjectDetailAPIView.as_view(), name='project-detail'),
]
