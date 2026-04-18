from rest_framework import serializers
from apps.accounts.models import User
from apps.websites.models import UserWebsite
from apps.content.models import Article
from apps.profiles.models import Experience, Education, Skill, Language, Certificate, Service, Project
from apps.profiles.api.serializers import ProjectSerializer
from apps.websites.section_visibility import merge_section_visibility
from apps.accounts.api.serializers import SubCategorySerializer

class WebsiteUserSerializer(serializers.ModelSerializer):
    profession_sub_category = SubCategorySerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'avatar', 'summary', 'city', 'phone_number', 'profession_sub_category', 'language']

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

class UserWebsiteSerializer(serializers.ModelSerializer):
    user = WebsiteUserSerializer(read_only=True)
    experiences = serializers.SerializerMethodField()
    educations = serializers.SerializerMethodField()
    skills = serializers.SerializerMethodField()
    languages = serializers.SerializerMethodField()
    certificates = serializers.SerializerMethodField()
    services = serializers.SerializerMethodField()
    projects = serializers.SerializerMethodField()
    articles_count = serializers.SerializerMethodField()
    section_visibility = serializers.SerializerMethodField()

    class Meta:
        model = UserWebsite
        fields = [
            'user', 'template_id', 'banner',
            'experiences', 'educations', 'skills', 'languages', 'certificates', 'services',
            'projects', 'articles_count', 'section_visibility',
        ]

    def get_articles_count(self, obj):
        return obj.user.articles.count()

    def get_section_visibility(self, obj):
        return merge_section_visibility(obj.section_visibility or {})

    def get_projects(self, obj):
        qs = obj.user.projects.filter(company__isnull=True).order_by('-date')
        return ProjectSerializer(qs, many=True).data

    def get_services(self, obj):
        # Personal portfolio only — company microsite services share the same user FK.
        qs = obj.user.services.filter(company__isnull=True).order_by('-id')
        return ServiceSerializer(qs, many=True).data

    def get_experiences(self, obj):
        qs = obj.user.experiences.all().order_by('-start_date')
        return ExperienceSerializer(qs, many=True).data

    def get_educations(self, obj):
        qs = obj.user.educations.all().order_by('-start_date')
        return EducationSerializer(qs, many=True).data

    def get_skills(self, obj):
        qs = obj.user.skills.all()
        return SkillSerializer(qs, many=True).data

    def get_languages(self, obj):
        qs = obj.user.languages.all()
        return LanguageSerializer(qs, many=True).data

    def get_certificates(self, obj):
        qs = obj.user.certificates.all().order_by('-issue_date')
        return CertificateSerializer(qs, many=True).data


class ArticlePublicSerializer(serializers.ModelSerializer):
    """Public-facing article serializer for portfolio websites."""
    author = WebsiteUserSerializer(read_only=True)

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'image', 'body',
            'author', 'created_at', 'updated_at', 'language'
        ]
