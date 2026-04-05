import hmac
import random
from datetime import timedelta

from django.core.files import File
from django.db import IntegrityError, transaction
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, permissions, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.business.api.serializers import CompanySerializer
from apps.business.models import Company, CompanyRegistrationPending
from apps.content.models import Article
from core.utils.email import send_company_registration_code_email


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class CompanyListAPIView(generics.ListAPIView):
    queryset = (
        Company.objects.select_related("owner", "who_we_are", "what_we_do", "our_values")
        .prefetch_related("services")
        .order_by("-founded_at")
    )
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    filterset_fields = ["company_size"]
    search_fields = ["name", "summary", "services__title"]


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
        "owner", "who_we_are", "what_we_do", "our_values"
    ).prefetch_related("services")
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = "slug"
