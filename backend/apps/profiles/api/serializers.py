from rest_framework import serializers
from apps.profiles.models import Experience, Education, Skill, QuickNote, Language, Certificate, Service, Project

class ExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experience
        fields = ['id', 'position', 'company_name', 'start_date', 'end_date']

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
    class Meta:
        model = Service
        fields = ['id', 'title', 'description', 'steps']

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'title', 'description', 'date', 'image']
