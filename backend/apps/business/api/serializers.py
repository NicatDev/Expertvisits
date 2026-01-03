from rest_framework import serializers
from apps.business.models import Company, Vacancy, OngoingProject, VacancyApplication

class VacancyApplicationSerializer(serializers.ModelSerializer):
    applicant_details = serializers.SerializerMethodField()
    vacancy_title = serializers.ReadOnlyField(source='vacancy.title')
    company_name = serializers.ReadOnlyField(source='vacancy.company.name')

    class Meta:
        model = VacancyApplication
        fields = ['id', 'vacancy', 'vacancy_title', 'company_name', 'applicant', 'applicant_details', 'motivation_letter', 'status', 'created_at']
        read_only_fields = ['applicant', 'status', 'created_at']

    def get_applicant_details(self, obj):
        return {
            'id': obj.applicant.id,
            'full_name': f"{obj.applicant.first_name} {obj.applicant.last_name}",
            'email': obj.applicant.email,
            'avatar': obj.applicant.avatar.url if obj.applicant.avatar else None,
            'username': obj.applicant.username
        }

class CompanySerializer(serializers.ModelSerializer):
    owner = serializers.StringRelatedField(read_only=True)
    slug = serializers.SlugField(read_only=True)

    class Meta:
        model = Company
        fields = '__all__'

class VacancySerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    company_id = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.all(), write_only=True, source='company'
    )
    is_applied = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Vacancy
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    creator = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = OngoingProject
        fields = '__all__'
