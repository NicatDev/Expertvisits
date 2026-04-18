from .companies import (
    CompanyListAPIView,
    CompanyDetailAPIView,
    CompanyRegistrationStartView,
    CompanyRegistrationCompleteView,
    CompanySiteContactAPIView,
    CompanyWebsiteManageAPIView,
)
from .vacancies import (
    VacancyListCreateAPIView, VacancyDetailAPIView, 
    MyVacanciesAPIView, VacancyApplicantsAPIView, VacancyCheckAppliedAPIView
)
from .applications import (
    ApplicationListCreateAPIView, ApplicationDetailAPIView, ApplicationStatusAPIView
)
from .projects import ProjectListCreateAPIView, ProjectDetailAPIView
from .sections import (
    WhoWeAreListCreateAPIView, WhoWeAreDetailAPIView,
    WhatWeDoListCreateAPIView, WhatWeDoDetailAPIView,
    OurValuesListCreateAPIView, OurValuesDetailAPIView,
    CompanyServiceListCreateAPIView, CompanyServiceDetailAPIView,
    CompanyPartnerCardListCreateAPIView, CompanyPartnerCardDetailAPIView,
)
