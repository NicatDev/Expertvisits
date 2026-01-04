from rest_framework import serializers
from apps.business import models as business_models

class VacancyApplicationSerializer(serializers.ModelSerializer):
    vacancy_title = serializers.ReadOnlyField(source='vacancy.title')
    company_name = serializers.ReadOnlyField(source='vacancy.company.name')
    applicant_first_name = serializers.ReadOnlyField(source='applicant.first_name')
    applicant_last_name = serializers.ReadOnlyField(source='applicant.last_name')
    applicant_username = serializers.ReadOnlyField(source='applicant.username')
    applicant_avatar = serializers.SerializerMethodField()

    class Meta:
        model = business_models.VacancyApplication
        fields = ['id', 'vacancy', 'vacancy_title', 'company_name', 'applicant', 'applicant_first_name', 'applicant_last_name', 'applicant_username', 'applicant_avatar', 'motivation_letter', 'status', 'created_at']
        read_only_fields = ['applicant', 'status', 'created_at']

    def get_applicant_avatar(self, obj):
        if obj.applicant.avatar:
            try:
                request = self.context.get('request')
                url = obj.applicant.avatar.url
                if request:
                    return request.build_absolute_uri(url)
                return url
            except:
                return None
        return None

class WhoWeAreSerializer(serializers.ModelSerializer):
    class Meta:
        model = business_models.WhoWeAre
        fields = '__all__'

class WhatWeDoSerializer(serializers.ModelSerializer):
    class Meta:
        model = business_models.WhatWeDo
        fields = '__all__'

class OurValuesSerializer(serializers.ModelSerializer):
    class Meta:
        model = business_models.OurValues
        fields = '__all__'

class CompanyServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = business_models.CompanyService
        fields = '__all__'

class CompanySerializer(serializers.ModelSerializer):
    owner = serializers.StringRelatedField(read_only=True)
    owner_id = serializers.PrimaryKeyRelatedField(source='owner', read_only=True)
    slug = serializers.SlugField(read_only=True)
    
    who_we_are = WhoWeAreSerializer(many=True, read_only=True)
    what_we_do = WhatWeDoSerializer(many=True, read_only=True)
    our_values = OurValuesSerializer(many=True, read_only=True)
    services = CompanyServiceSerializer(many=True, read_only=True)
    delete_logo = serializers.BooleanField(write_only=True, required=False)

    class Meta:
        model = business_models.Company
        fields = '__all__'

    def update(self, instance, validated_data):
        delete_logo = validated_data.pop('delete_logo', False)
        if delete_logo:
            instance.logo = None
        return super().update(instance, validated_data)

class VacancySerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    company_id = serializers.PrimaryKeyRelatedField(
        queryset=business_models.Company.objects.all(), write_only=True, source='company'
    )
    is_applied = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = business_models.Vacancy
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    creator = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = business_models.OngoingProject
        fields = '__all__'
