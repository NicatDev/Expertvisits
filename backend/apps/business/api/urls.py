from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.business.api.views import (
    CompanyListAPIView,
    CompanyDetailAPIView,
    CompanyRegistrationStartView,
    CompanyRegistrationCompleteView,
    VacancyListCreateAPIView, VacancyDetailAPIView, 
    MyVacanciesAPIView, VacancyApplicantsAPIView, VacancyCheckAppliedAPIView,
    ApplicationListCreateAPIView, ApplicationDetailAPIView, ApplicationStatusAPIView,
    ProjectListCreateAPIView, ProjectDetailAPIView,
    WhoWeAreListCreateAPIView, WhoWeAreDetailAPIView,
    WhatWeDoListCreateAPIView, WhatWeDoDetailAPIView,
    OurValuesListCreateAPIView, OurValuesDetailAPIView,
    CompanyServiceListCreateAPIView, CompanyServiceDetailAPIView
)

urlpatterns = [
    # Companies
    path(
        "companies/start-registration/",
        CompanyRegistrationStartView.as_view(),
        name="company-start-registration",
    ),
    path(
        "companies/complete-registration/",
        CompanyRegistrationCompleteView.as_view(),
        name="company-complete-registration",
    ),
    path("companies/", CompanyListAPIView.as_view(), name="company-list"),
    path("companies/<slug:slug>/", CompanyDetailAPIView.as_view(), name="company-detail"),

    # Vacancies
    path('vacancies/', VacancyListCreateAPIView.as_view(), name='vacancy-list'),
    path('vacancies/my_vacancies/', MyVacanciesAPIView.as_view(), name='my-vacancies'), # Ensure this comes before slug
    path('vacancies/<slug:slug>/', VacancyDetailAPIView.as_view(), name='vacancy-detail'),
    path('vacancies/<slug:slug>/applicants/', VacancyApplicantsAPIView.as_view(), name='vacancy-applicants'),
    path('vacancies/<slug:slug>/check_applied/', VacancyCheckAppliedAPIView.as_view(), name='vacancy-check-applied'),

    # Applications
    path('applications/', ApplicationListCreateAPIView.as_view(), name='application-list'),
    path('applications/<int:pk>/', ApplicationDetailAPIView.as_view(), name='application-detail'),
    path('applications/<int:pk>/set_status/', ApplicationStatusAPIView.as_view(), name='application-set-status'),

    # Projects
    path('projects/', ProjectListCreateAPIView.as_view(), name='project-list'),
    path('projects/<int:pk>/', ProjectDetailAPIView.as_view(), name='project-detail'),

    # Company Sections
    path('who-we-are/', WhoWeAreListCreateAPIView.as_view(), name='who-we-are-list'),
    path('who-we-are/<int:pk>/', WhoWeAreDetailAPIView.as_view(), name='who-we-are-detail'),
    
    path('what-we-do/', WhatWeDoListCreateAPIView.as_view(), name='what-we-do-list'),
    path('what-we-do/<int:pk>/', WhatWeDoDetailAPIView.as_view(), name='what-we-do-detail'),

    path('our-values/', OurValuesListCreateAPIView.as_view(), name='our-values-list'),
    path('our-values/<int:pk>/', OurValuesDetailAPIView.as_view(), name='our-values-detail'),

    path('services/', CompanyServiceListCreateAPIView.as_view(), name='company-services-list'),
    path('services/<int:pk>/', CompanyServiceDetailAPIView.as_view(), name='company-services-detail'),
]
