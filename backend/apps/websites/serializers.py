from rest_framework import serializers
from apps.accounts.models import User
from apps.websites.models import UserWebsite
from apps.content.models import Article
from apps.profiles.models import Experience, Education, Skill, Language, Certificate
from apps.accounts.api.serializers import SubCategorySerializer

class WebsiteUserSerializer(serializers.ModelSerializer):
    profession_sub_category = SubCategorySerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'avatar', 'summary', 'city', 'phone_number', 'profession_sub_category']

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

class UserWebsiteSerializer(serializers.ModelSerializer):
    user = WebsiteUserSerializer(read_only=True)
    experiences = serializers.SerializerMethodField()
    educations = serializers.SerializerMethodField()
    skills = serializers.SerializerMethodField()
    languages = serializers.SerializerMethodField()
    certificates = serializers.SerializerMethodField()
    
    class Meta:
        model = UserWebsite
        fields = [
            'user', 'template_id', 'banner', 
            'experiences', 'educations', 'skills', 'languages', 'certificates'
        ]

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
            'author', 'created_at', 'updated_at',
        ]
