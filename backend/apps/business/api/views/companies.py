import hmac
import logging
import random
import re
from datetime import timedelta

logger = logging.getLogger(__name__)

from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.files import File
from django.db import IntegrityError, transaction
from django.db.models import Case, IntegerField, Value, When
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, permissions, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from apps.business.api.serializers import CompanySerializer
from apps.business.company_website_visibility import (
    merge_company_website_visibility,
    public_company_site_url,
    validate_company_website_visibility,
)
from apps.business.models import Company, CompanyRegistrationPending, CompanyWebsite
from apps.content.models import Article

_HEX_COLOR = re.compile(r"^#[0-9A-Fa-f]{6}$")
_THEME_PRIMARY_DEFAULT = "#1e40af"
_THEME_SECONDARY_DEFAULT = "#6366f1"


def _normalize_theme_hex(value, default):
    if not value or not isinstance(value, str):
        return default
    s = value.strip()
    return s.lower() if _HEX_COLOR.match(s) else default

from core.utils.email import (
    send_company_registration_code_email,
    send_company_site_contact_email,
    send_company_site_contact_confirmation_email,
)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class CompanyListAPIView(generics.ListAPIView):
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    filterset_fields = ["company_size"]
    search_fields = ["name", "summary", "services__title"]

    def get_queryset(self):
        qs = (
            Company.objects.select_related("owner", "who_we_are", "what_we_do", "our_values")
            .prefetch_related("services")
        )
        user = self.request.user
        if user.is_authenticated:
            qs = qs.annotate(
                _mine_order=Case(
                    When(owner=user, then=Value(0)),
                    default=Value(1),
                    output_field=IntegerField(),
                )
            ).order_by("_mine_order", "-founded_at")
        else:
            qs = qs.order_by("-founded_at")
        return qs


class CompanyRegistrationStartView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if Company.objects.filter(owner=request.user).exists():
            return Response(
                {"detail": "You already have a company profile."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if Article.objects.filter(author=request.user).count() < 3:
            return Response(
                {"detail": "At least three published articles are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        name = (request.data.get("name") or "").strip()
        summary = (request.data.get("summary") or "").strip()
        email = (request.data.get("email") or "").strip()
        founded_at = request.data.get("founded_at")
        company_size = (request.data.get("company_size") or "1-10").strip()
        phone = (request.data.get("phone") or "").strip() or None
        address = (request.data.get("address") or "").strip() or None
        website_url = (request.data.get("website_url") or "").strip() or None
        logo = request.FILES.get("logo")

        errors = {}
        if not name:
            errors["name"] = ["This field is required."]
        if not summary:
            errors["summary"] = ["This field is required."]
        if not email:
            errors["email"] = ["This field is required."]
        if not founded_at:
            errors["founded_at"] = ["This field is required."]
        valid_sizes = {c[0] for c in Company.SIZE_CHOICES}
        if company_size not in valid_sizes:
            errors["company_size"] = ["Invalid choice."]
        if not logo:
            errors["logo"] = ["This field is required."]
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        code = f"{random.randint(100000, 999999)}"
        expires_at = timezone.now() + timedelta(hours=24)

        CompanyRegistrationPending.objects.filter(user=request.user).delete()

        pending = CompanyRegistrationPending.objects.create(
            user=request.user,
            email=email,
            code=code,
            expires_at=expires_at,
            name=name,
            summary=summary,
            founded_at=founded_at,
            company_size=company_size,
            phone=phone,
            address=address,
            website_url=website_url,
            logo=logo,
        )

        try:
            send_company_registration_code_email(email, code, name)
        except Exception:
            pending.delete()
            return Response(
                {"detail": "Could not send verification email. Try again later."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            {"detail": "verification_sent", "email": email},
            status=status.HTTP_201_CREATED,
        )


class CompanyRegistrationCompleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if Company.objects.filter(owner=request.user).exists():
            return Response(
                {"detail": "You already have a company profile."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        raw_code = (request.data.get("code") or "").strip()
        if len(raw_code) != 6 or not raw_code.isdigit():
            return Response({"code": ["Invalid code."]}, status=status.HTTP_400_BAD_REQUEST)

        pending = (
            CompanyRegistrationPending.objects.filter(user=request.user)
            .order_by("-created_at")
            .first()
        )
        if not pending or pending.expires_at < timezone.now():
            return Response(
                {"code": ["Code expired or missing. Start registration again."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not hmac.compare_digest(pending.code, raw_code):
            return Response({"code": ["Invalid code."]}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                company = Company(
                    owner=request.user,
                    name=pending.name,
                    summary=pending.summary,
                    founded_at=pending.founded_at,
                    email=pending.email,
                    company_size=pending.company_size,
                    phone=pending.phone,
                    address=pending.address,
                    website_url=pending.website_url,
                )
                if pending.logo:
                    with pending.logo.open("rb") as f:
                        company.logo.save(pending.logo.name, File(f), save=False)
                company.save()
                pending.delete()
        except IntegrityError:
            return Response(
                {"detail": "Could not create company (duplicate name?)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        out = CompanySerializer(company, context={"request": request}).data
        return Response(out, status=status.HTTP_201_CREATED)


class CompanyDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Company.objects.select_related(
        "owner", "who_we_are", "what_we_do", "our_values", "website"
    ).prefetch_related("services")
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = "slug"


class CompanyWebsiteManageAPIView(APIView):
    """Owner-only: create/update/deactivate company microsite (/c/<slug>/)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, slug):
        company = get_object_or_404(
            Company.objects.select_related("website"),
            slug=slug,
        )
        if company.owner_id != request.user.id:
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
        pub = public_company_site_url(company.slug)
        try:
            cw = company.website
        except CompanyWebsite.DoesNotExist:
            return Response(
                {
                    "template_id": None,
                    "template_label": "",
                    "is_active": False,
                    "section_visibility": merge_company_website_visibility({}),
                    "public_url": pub,
                    "theme_primary": _THEME_PRIMARY_DEFAULT,
                    "theme_secondary": _THEME_SECONDARY_DEFAULT,
                }
            )
        return Response(
            {
                "template_id": cw.template_id,
                "template_label": cw.template_label or "",
                "is_active": cw.is_active,
                "section_visibility": merge_company_website_visibility(cw.section_visibility),
                "public_url": pub,
                "theme_primary": _normalize_theme_hex(
                    cw.theme_primary, _THEME_PRIMARY_DEFAULT
                ),
                "theme_secondary": _normalize_theme_hex(
                    cw.theme_secondary, _THEME_SECONDARY_DEFAULT
                ),
            }
        )

    def post(self, request, slug):
        company = get_object_or_404(Company, slug=slug)
        if company.owner_id != request.user.id:
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        template_id = request.data.get("template_id")
        if template_id is None:
            return Response({"detail": "template_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            template_id = int(template_id)
        except (TypeError, ValueError):
            return Response({"detail": "Invalid template_id."}, status=status.HTTP_400_BAD_REQUEST)

        if template_id not in (1, 2, 3):
            return Response(
                {"detail": "template_id must be 1, 2, or 3."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        theme_primary = _normalize_theme_hex(
            request.data.get("theme_primary"), _THEME_PRIMARY_DEFAULT
        )
        theme_secondary = _normalize_theme_hex(
            request.data.get("theme_secondary"), _THEME_SECONDARY_DEFAULT
        )

        template_label = (request.data.get("template_label") or "").strip()[:120]
        raw_vis = request.data.get("section_visibility")
        vis = merge_company_website_visibility(raw_vis if isinstance(raw_vis, dict) else {})
        try:
            validate_company_website_visibility(company, vis)
        except DjangoValidationError as e:
            err = e.message_dict if hasattr(e, "message_dict") else {"detail": e.messages}
            return Response(err, status=status.HTTP_400_BAD_REQUEST)

        CompanyWebsite.objects.update_or_create(
            company=company,
            defaults={
                "template_id": template_id,
                "template_label": template_label,
                "theme_primary": theme_primary,
                "theme_secondary": theme_secondary,
                "is_active": True,
                "section_visibility": vis,
            },
        )
        return Response(
            {
                "detail": "Company website saved.",
                "public_url": public_company_site_url(company.slug),
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, slug):
        company = get_object_or_404(Company.objects.select_related("website"), slug=slug)
        if company.owner_id != request.user.id:
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
        try:
            cw = company.website
        except CompanyWebsite.DoesNotExist:
            return Response({"detail": "No website configured."}, status=status.HTTP_404_NOT_FOUND)
        cw.is_active = False
        cw.save(update_fields=["is_active", "updated_at"])
        return Response({"detail": "Company website deactivated."}, status=status.HTTP_200_OK)


class CompanySiteContactAPIView(APIView):
    """Public contact form for company microsites (/c/<slug>/)."""

    permission_classes = [AllowAny]

    def post(self, request, slug):
        name = (request.data.get("name") or "").strip()
        email = (request.data.get("email") or "").strip()
        subject = (request.data.get("subject") or "").strip()
        message = (request.data.get("message") or "").strip()

        if not all([name, email, subject, message]):
            return Response(
                {"detail": "Name, email, subject, and message are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        company = Company.objects.filter(slug=slug).first()
        if not company:
            return Response(
                {"detail": "Company not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        to_email = (company.email or "").strip()
        if not to_email:
            return Response(
                {"detail": "Company has no contact email on file."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            send_company_site_contact_email(
                to_email,
                name,
                email,
                subject,
                message,
            )
        except Exception:
            return Response(
                {"detail": "Failed to send email. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        try:
            send_company_site_contact_confirmation_email(email, company.name, subject)
        except Exception:
            logger.exception("Company contact confirmation email failed for %s", email)
        return Response({"detail": "Message sent successfully."}, status=status.HTTP_200_OK)
