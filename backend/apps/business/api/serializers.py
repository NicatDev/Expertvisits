from rest_framework import serializers
from apps.business import models as business_models

class VacancyApplicationSerializer(serializers.ModelSerializer):
    vacancy_title = serializers.ReadOnlyField(source='vacancy.title')
    company_name = serializers.ReadOnlyField(source='vacancy.company.name')
    vacancy_title = serializers.ReadOnlyField(source='vacancy.title')
    company_name = serializers.ReadOnlyField(source='vacancy.company.name')
    applicant_details = serializers.SerializerMethodField()

    class Meta:
        model = business_models.VacancyApplication
        fields = ['id', 'vacancy', 'vacancy_title', 'company_name', 'applicant', 'applicant_details', 'motivation_letter', 'status', 'created_at']
        read_only_fields = ['applicant', 'status', 'created_at']

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
    delete_image = serializers.BooleanField(write_only=True, required=False)

    class Meta:
        model = business_models.WhoWeAre
        fields = '__all__'

    def create(self, validated_data):
        validated_data.pop('delete_image', None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        delete_image = validated_data.pop('delete_image', False)
        if delete_image:
            instance.image = None
        return super().update(instance, validated_data)

class WhatWeDoSerializer(serializers.ModelSerializer):
    delete_image = serializers.BooleanField(write_only=True, required=False)

    class Meta:
        model = business_models.WhatWeDo
        fields = '__all__'

    def create(self, validated_data):
        validated_data.pop('delete_image', None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        delete_image = validated_data.pop('delete_image', False)
        if delete_image:
            instance.image = None
        return super().update(instance, validated_data)

class OurValuesSerializer(serializers.ModelSerializer):
    delete_image = serializers.BooleanField(write_only=True, required=False)

    class Meta:
        model = business_models.OurValues
        fields = '__all__'

    def create(self, validated_data):
        validated_data.pop('delete_image', None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        delete_image = validated_data.pop('delete_image', False)
        if delete_image:
            instance.image = None
        return super().update(instance, validated_data)

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

class CompanySerializer(serializers.ModelSerializer):
    owner = serializers.StringRelatedField(read_only=True)
    owner_id = serializers.PrimaryKeyRelatedField(source='owner', read_only=True)
    slug = serializers.SlugField(read_only=True)
    
    who_we_are = WhoWeAreSerializer(read_only=True)
    what_we_do = WhatWeDoSerializer(read_only=True)
    our_values = OurValuesSerializer(read_only=True)
    services = CompanyServiceSerializer(many=True, read_only=True)
    delete_logo = serializers.BooleanField(write_only=True, required=False)
    delete_cover_image = serializers.BooleanField(write_only=True, required=False)

    class Meta:
        model = business_models.Company
        fields = '__all__'

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
