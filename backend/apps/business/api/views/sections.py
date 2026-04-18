from rest_framework import generics, permissions, serializers
from apps.business.models import WhoWeAre, WhatWeDo, OurValues, CompanyService, CompanyPartnerCard
from apps.business.api.serializers import (
    WhoWeAreSerializer, WhatWeDoSerializer, OurValuesSerializer, CompanyServiceSerializer,
    CompanyPartnerCardSerializer,
)

class BaseSectionListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        company = serializer.validated_data['company']
        if company.owner != self.request.user:
             raise serializers.ValidationError("Permission denied.")
        serializer.save()

class BaseSectionDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_update(self, serializer):
        obj = self.get_object()
        if obj.company.owner != self.request.user:
             raise serializers.ValidationError("Permission denied.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.company.owner != self.request.user:
             raise serializers.ValidationError("Permission denied.")
        instance.delete()

# Implementations
class WhoWeAreListCreateAPIView(BaseSectionListCreateAPIView):
    queryset = WhoWeAre.objects.select_related('company')
    serializer_class = WhoWeAreSerializer

class WhoWeAreDetailAPIView(BaseSectionDetailAPIView):
    queryset = WhoWeAre.objects.select_related('company')
    serializer_class = WhoWeAreSerializer

class WhatWeDoListCreateAPIView(BaseSectionListCreateAPIView):
    queryset = WhatWeDo.objects.select_related('company')
    serializer_class = WhatWeDoSerializer

class WhatWeDoDetailAPIView(BaseSectionDetailAPIView):
    queryset = WhatWeDo.objects.select_related('company')
    serializer_class = WhatWeDoSerializer

class OurValuesListCreateAPIView(BaseSectionListCreateAPIView):
    queryset = OurValues.objects.select_related('company')
    serializer_class = OurValuesSerializer

class OurValuesDetailAPIView(BaseSectionDetailAPIView):
    queryset = OurValues.objects.select_related('company')
    serializer_class = OurValuesSerializer

class CompanyServiceListCreateAPIView(BaseSectionListCreateAPIView):
    queryset = CompanyService.objects.select_related('company')
    serializer_class = CompanyServiceSerializer

class CompanyServiceDetailAPIView(BaseSectionDetailAPIView):
    queryset = CompanyService.objects.select_related('company')
    serializer_class = CompanyServiceSerializer


class CompanyPartnerCardListCreateAPIView(BaseSectionListCreateAPIView):
    queryset = CompanyPartnerCard.objects.select_related('company')
    serializer_class = CompanyPartnerCardSerializer

    def get_queryset(self):
        company_id = self.request.query_params.get('company')
        qs = CompanyPartnerCard.objects.select_related('company')
        if not company_id:
            return qs.none()
        return qs.filter(
            company_id=company_id,
            kind=CompanyPartnerCard.Kind.PARTNER,
        ).order_by('sort_order', 'id')

    def perform_create(self, serializer):
        company = serializer.validated_data['company']
        if company.owner != self.request.user:
            raise serializers.ValidationError('Permission denied.')
        serializer.save(kind=CompanyPartnerCard.Kind.PARTNER)


class CompanyPartnerCardDetailAPIView(BaseSectionDetailAPIView):
    queryset = CompanyPartnerCard.objects.select_related('company').filter(
        kind=CompanyPartnerCard.Kind.PARTNER
    )
    serializer_class = CompanyPartnerCardSerializer

    def perform_update(self, serializer):
        obj = self.get_object()
        if obj.company.owner != self.request.user:
            raise serializers.ValidationError('Permission denied.')
        serializer.save(kind=CompanyPartnerCard.Kind.PARTNER)
