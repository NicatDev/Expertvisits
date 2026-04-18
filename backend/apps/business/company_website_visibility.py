"""Company microsite (/c/<slug>/) section flags — stored on CompanyWebsite.section_visibility."""
from __future__ import annotations

from typing import Any, Dict, Optional

# Public URL base for QR / copy (no trailing slash); override via Django settings if needed.
def public_company_site_url(slug: str) -> str:
    try:
        from django.conf import settings

        base = getattr(settings, "PUBLIC_COMPANY_WEBSITE_BASE", "https://expertvisits.com/c")
    except Exception:
        base = "https://expertvisits.com/c"
    return f"{base.rstrip('/')}/{slug}"

DEFAULT_COMPANY_WEBSITE_VISIBILITY: Dict[str, bool] = {
    "about_page": True,
    "services_on_home": False,
    "services_page": False,
    "projects_on_home": False,
    "projects_page": False,
    "partners_on_home": False,
    "partners_page": False,
    "vacancies_on_home": False,
    "vacancies_page": False,
}


def merge_company_website_visibility(raw: Optional[Dict[str, Any]]) -> Dict[str, bool]:
    out = dict(DEFAULT_COMPANY_WEBSITE_VISIBILITY)
    if not raw or not isinstance(raw, dict):
        return out
    for key in DEFAULT_COMPANY_WEBSITE_VISIBILITY:
        if key in raw:
            out[key] = bool(raw[key])
    return out


def validate_company_website_visibility(company, vis: Dict[str, bool]) -> None:
    from django.core.exceptions import ValidationError
    from apps.profiles.models import Service as ProfileService
    from apps.business.models import Vacancy, CompanyPartnerCard

    services_n = ProfileService.objects.filter(company=company).count()
    projects_n = company.company_projects.count()
    partners_n = CompanyPartnerCard.objects.filter(
        company=company, kind=CompanyPartnerCard.Kind.PARTNER
    ).count()
    vacancies_n = Vacancy.objects.filter(company=company).count()

    def need(flag: str, count: int, label: str):
        if vis.get(flag) and count < 1:
            raise ValidationError({flag: f"Add at least one {label} before enabling this section."})

    need("services_on_home", services_n, "service")
    need("services_page", services_n, "service")
    need("projects_on_home", projects_n, "project")
    need("projects_page", projects_n, "project")
    need("partners_on_home", partners_n, "partner")
    need("partners_page", partners_n, "partner")
    need("vacancies_on_home", vacancies_n, "vacancy")
    need("vacancies_page", vacancies_n, "vacancy")
