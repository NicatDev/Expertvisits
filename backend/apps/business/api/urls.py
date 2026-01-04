from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.business.api.views import (
    CompanyViewSet, VacancyViewSet, ProjectViewSet, VacancyApplicationViewSet,
    WhoWeAreViewSet, WhatWeDoViewSet, OurValuesViewSet, CompanyServiceViewSet
)

router = DefaultRouter()
router.register(r'companies', CompanyViewSet)
router.register(r'vacancies', VacancyViewSet)
router.register(r'applications', VacancyApplicationViewSet, basename='vacancy-application')
router.register(r'projects', ProjectViewSet)
router.register(r'who-we-are', WhoWeAreViewSet)
router.register(r'what-we-do', WhatWeDoViewSet)
router.register(r'our-values', OurValuesViewSet)
router.register(r'services', CompanyServiceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
