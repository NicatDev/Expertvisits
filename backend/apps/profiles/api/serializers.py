from rest_framework import serializers
from apps.business.models import Company
from apps.profiles.models import Experience, Education, Skill, QuickNote, Language, Certificate, Service, Project

class ExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experience
        fields = ['id', 'position', 'company_name', 'start_date', 'end_date', 'responsibilities']

class EducationSerializer(serializers.ModelSerializer):
    degree_type_display = serializers.CharField(source='get_degree_type_display', read_only=True)

    class Meta:
        model = Education
        fields = ['id', 'degree_type', 'degree_type_display', 'institution', 'field_of_study', 'start_date', 'end_date']

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name', 'skill_type']

class QuickNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuickNote
        fields = ['id', 'content']

class LanguageSerializer(serializers.ModelSerializer):
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    class Meta:
        model = Language
        fields = ['id', 'name', 'level', 'level_display']

class CertificateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certificate
        fields = ['id', 'name', 'issuing_organization', 'issue_date']

class ServiceSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = Service
        fields = ['id', 'title', 'description', 'steps', 'company']

    def validate_company(self, value):
        if value is None:
            return value
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError('Authentication required.')
        if value.owner_id != request.user.id:
            raise serializers.ValidationError('You can only link services to companies you own.')
        return value

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'title', 'description', 'date', 'image', 'url']
