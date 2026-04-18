from rest_framework import serializers
from apps.business import models as business_models
from apps.business.company_website_visibility import (
    merge_company_website_visibility,
    public_company_site_url,
)
from apps.profiles.models import Service as ProfileService
from apps.profiles.api.serializers import (
    ServiceSerializer as ProfileServiceSerializer,
    ProjectSerializer,
)


def _absolute_media_url(request, file_field):
    if not file_field:
        return None
    try:
        url = file_field.url
    except Exception:
        return None
    if request:
        return request.build_absolute_uri(url)
    return url


class VacancyApplicationSerializer(serializers.ModelSerializer):
    vacancy_title = serializers.ReadOnlyField(source="vacancy.title")
    company_name = serializers.SerializerMethodField()
    applicant_details = serializers.SerializerMethodField()

    class Meta:
        model = business_models.VacancyApplication
        fields = [
            "id",
            "vacancy",
            "vacancy_title",
            "company_name",
            "applicant",
            "applicant_details",
            "motivation_letter",
            "status",
            "created_at",
        ]
        read_only_fields = ["applicant", "status", "created_at"]

    def get_company_name(self, obj):
        v = obj.vacancy
        if v.posted_as == business_models.Vacancy.PostedAs.INDIVIDUAL or not v.company_id:
            return (v.employer_display_name or "").strip()
        return v.company.name

    def get_applicant_details(self, obj):
        applicant = obj.applicant
        avatar_url = None
        if applicant.avatar:
            try:
                request = self.context.get('request')
                url = applicant.avatar.url
                if request:
                    avatar_url = request.build_absolute_uri(url)
                else:
                    avatar_url = url
            except:
                pass
        
        return {
            'id': applicant.id,
            'full_name': applicant.get_full_name(),
            'username': applicant.username,
            'avatar': avatar_url
        }

class WhoWeAreSerializer(serializers.ModelSerializer):
    """`title` kept on model for DB compatibility; API is description-only."""

    class Meta:
        model = business_models.WhoWeAre
        fields = ('id', 'company', 'description', 'created_at')
        read_only_fields = ('created_at',)

    def create(self, validated_data):
        return business_models.WhoWeAre.objects.create(title='', **validated_data)

    def update(self, instance, validated_data):
        instance = super().update(instance, validated_data)
        instance.title = ''
        instance.save(update_fields=['title'])
        return instance


class WhatWeDoSerializer(serializers.ModelSerializer):
    class Meta:
        model = business_models.WhatWeDo
        fields = ('id', 'company', 'description', 'created_at')
        read_only_fields = ('created_at',)

    def create(self, validated_data):
        return business_models.WhatWeDo.objects.create(title='', **validated_data)

    def update(self, instance, validated_data):
        instance = super().update(instance, validated_data)
        instance.title = ''
        instance.save(update_fields=['title'])
        return instance


class OurValuesSerializer(serializers.ModelSerializer):
    class Meta:
        model = business_models.OurValues
        fields = ('id', 'company', 'description', 'created_at')
        read_only_fields = ('created_at',)

    def create(self, validated_data):
        return business_models.OurValues.objects.create(title='', **validated_data)

    def update(self, instance, validated_data):
        instance = super().update(instance, validated_data)
        instance.title = ''
        instance.save(update_fields=['title'])
        return instance

class CompanyServiceSerializer(serializers.ModelSerializer):
    delete_image = serializers.BooleanField(write_only=True, required=False)

    class Meta:
        model = business_models.CompanyService
        fields = '__all__'

    def create(self, validated_data):
        validated_data.pop('delete_image', None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        delete_image = validated_data.pop('delete_image', False)
        if delete_image:
            instance.image = None
        return super().update(instance, validated_data)


class CompanyPartnerCardSerializer(serializers.ModelSerializer):
    delete_logo = serializers.BooleanField(write_only=True, required=False)

    class Meta:
        model = business_models.CompanyPartnerCard
        fields = ('id', 'company', 'kind', 'title', 'logo', 'sort_order', 'delete_logo')
        read_only_fields = ('id',)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data.pop('company', None)
        request = self.context.get('request')
        data['logo'] = _absolute_media_url(request, instance.logo)
        return data

    def create(self, validated_data):
        validated_data.pop('delete_logo', None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        delete_logo = validated_data.pop('delete_logo', False)
        if delete_logo:
            instance.logo = None
        return super().update(instance, validated_data)


class CompanySerializer(serializers.ModelSerializer):
    owner = serializers.StringRelatedField(read_only=True)
    owner_id = serializers.PrimaryKeyRelatedField(source='owner', read_only=True)
    slug = serializers.SlugField(read_only=True)
    website = serializers.SerializerMethodField(read_only=True)

    who_we_are = WhoWeAreSerializer(read_only=True)
    what_we_do = WhatWeDoSerializer(read_only=True)
    our_values = OurValuesSerializer(read_only=True)
    services = serializers.SerializerMethodField()
    company_projects = serializers.SerializerMethodField()
    partners = serializers.SerializerMethodField()
    delete_logo = serializers.BooleanField(write_only=True, required=False)
    delete_cover_image = serializers.BooleanField(write_only=True, required=False)

    class Meta:
        model = business_models.Company
        fields = '__all__'

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        data['logo'] = _absolute_media_url(request, instance.logo)
        data['cover_image'] = _absolute_media_url(request, instance.cover_image)
        return data

    def get_website(self, obj):
        request = self.context.get('request')
        is_owner = bool(
            request and request.user.is_authenticated and obj.owner_id == request.user.id
        )
        pub = public_company_site_url(obj.slug)
        merged_empty = merge_company_website_visibility({})
        try:
            cw = obj.website
        except business_models.CompanyWebsite.DoesNotExist:
            cw = None
        if not cw:
            if is_owner:
                return {
                    'is_active': False,
                    'template_id': None,
                    'template_label': '',
                    'section_visibility': merged_empty,
                    'public_url': pub,
                }
            return None
        vis = merge_company_website_visibility(cw.section_visibility)
        if is_owner:
            return {
                'is_active': cw.is_active,
                'template_id': cw.template_id,
                'template_label': cw.template_label or '',
                'section_visibility': vis,
                'public_url': pub,
            }
        if not cw.is_active:
            return None
        return {
            'is_active': True,
            'template_id': cw.template_id,
            'section_visibility': vis,
        }

    def get_services(self, obj):
        qs = ProfileService.objects.filter(company=obj).order_by('-id')
        return ProfileServiceSerializer(qs, many=True, context=self.context).data

    def get_company_projects(self, obj):
        qs = obj.company_projects.all().order_by('-date')
        return ProjectSerializer(qs, many=True, context=self.context).data

    def get_partners(self, obj):
        qs = business_models.CompanyPartnerCard.objects.filter(
            company=obj, kind=business_models.CompanyPartnerCard.Kind.PARTNER
        )
        return CompanyPartnerCardSerializer(qs, many=True, context=self.context).data

    def create(self, validated_data):
        validated_data.pop('delete_logo', None)
        validated_data.pop('delete_cover_image', None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        delete_logo = validated_data.pop('delete_logo', False)
        delete_cover = validated_data.pop('delete_cover_image', False)
        
        if delete_logo:
            instance.logo = None
        if delete_cover:
            instance.cover_image = None
            
        return super().update(instance, validated_data)

class VacancySerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    company_id = serializers.PrimaryKeyRelatedField(
        queryset=business_models.Company.objects.all(),
        write_only=True,
        source="company",
        required=False,
        allow_null=True,
    )
    is_applied = serializers.BooleanField(read_only=True)
    is_owner = serializers.SerializerMethodField()
    company_name = serializers.SerializerMethodField()
    publisher = serializers.SerializerMethodField()

    class Meta:
        model = business_models.Vacancy
        fields = "__all__"
        read_only_fields = ("posted_by", "slug", "posted_at", "language")

    def get_company_name(self, obj):
        if obj.posted_as == business_models.Vacancy.PostedAs.COMPANY and obj.company_id:
            return obj.company.name
        return (obj.employer_display_name or "").strip()

    def get_is_owner(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        u = request.user
        if obj.posted_by_id == u.id:
            return True
        if obj.company_id and obj.company.owner_id == u.id:
            return True
        return False

    def get_publisher(self, obj):
        request = self.context.get("request")
        if obj.posted_as == business_models.Vacancy.PostedAs.COMPANY and obj.company_id:
            c = obj.company
            return {
                "type": "company",
                "name": c.name,
                "slug": c.slug,
                "logo": _absolute_media_url(request, c.logo),
                "email": c.email,
                "phone": c.phone or "",
                "website_url": c.website_url or "",
            }
        return {
            "type": "individual",
            "name": (obj.employer_display_name or "").strip(),
            "slug": None,
            "logo": _absolute_media_url(request, obj.employer_logo),
            "email": obj.employer_email or "",
            "phone": obj.employer_phone or "",
            "website_url": obj.employer_website or "",
        }

    def validate(self, attrs):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required.")

        instance = getattr(self, "instance", None)
        posted_as = attrs.get("posted_as")
        if posted_as is None and instance is not None:
            posted_as = instance.posted_as
        if posted_as is None:
            posted_as = business_models.Vacancy.PostedAs.COMPANY

        company = attrs.get("company", instance.company if instance else None)

        if posted_as == business_models.Vacancy.PostedAs.COMPANY:
            if not company:
                raise serializers.ValidationError(
                    {"company_id": ["Select a company when posting as a company."]}
                )
            if company.owner_id != request.user.id:
                raise serializers.ValidationError(
                    {"company_id": ["You can only post for companies you own."]}
                )
            attrs["company"] = company
            if instance is None or instance.posted_as == business_models.Vacancy.PostedAs.INDIVIDUAL:
                attrs["employer_display_name"] = ""
                attrs["employer_email"] = ""
                attrs["employer_phone"] = ""
                attrs["employer_website"] = None
                attrs["employer_logo"] = None
        else:
            attrs["company"] = None
            req_name = (attrs.get("employer_display_name") or "").strip() or (
                instance.employer_display_name if instance else ""
            )
            req_email = (attrs.get("employer_email") or "").strip() or (
                instance.employer_email if instance else ""
            )
            req_phone = (attrs.get("employer_phone") or "").strip() or (
                instance.employer_phone if instance else ""
            )
            if not req_name:
                raise serializers.ValidationError(
                    {"employer_display_name": ["Business / display name is required."]}
                )
            if not req_email:
                raise serializers.ValidationError(
                    {"employer_email": ["Contact email is required."]}
                )
            if not req_phone:
                raise serializers.ValidationError(
                    {"employer_phone": ["Contact phone is required."]}
                )
            attrs["employer_display_name"] = req_name
            attrs["employer_email"] = req_email
            attrs["employer_phone"] = req_phone

        attrs["posted_as"] = posted_as
        return attrs

class ProjectSerializer(serializers.ModelSerializer):
    creator = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = business_models.OngoingProject
        fields = '__all__'
