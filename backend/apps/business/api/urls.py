from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.business.api.views import CompanyViewSet, VacancyViewSet, ProjectViewSet, VacancyApplicationViewSet

router = DefaultRouter()
router.register(r'companies', CompanyViewSet)
router.register(r'vacancies', VacancyViewSet)
router.register(r'applications', VacancyApplicationViewSet, basename='vacancy-application')
router.register(r'projects', ProjectViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
