from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from apps.accounts.models import User
from apps.profiles.models import Experience, Education, Skill, Language, Certificate
from apps.profiles.api.serializers import (
    ExperienceSerializer, EducationSerializer, SkillSerializer,
    LanguageSerializer, CertificateSerializer
)

class UserProfileDetailsAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        user_id = request.query_params.get('user_id')
        username = request.query_params.get('username')

        if not user_id and not username:
            return Response({'error': 'user_id or username required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if user_id:
                user = User.objects.get(id=user_id)
            else:
                user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        # Optimization: Could use prefetch_related on user if careful, but since these are separate models linked to user
        # we are doing 5 queries. It's acceptable for a detail view.
        # Alternatively, we can do parallel async or just simple sequential queries as is.
        
        data = {
            'experience': ExperienceSerializer(Experience.objects.filter(user=user), many=True).data,
            'education': EducationSerializer(Education.objects.filter(user=user), many=True).data,
            'skills': SkillSerializer(Skill.objects.filter(user=user), many=True).data,
            'languages': LanguageSerializer(Language.objects.filter(user=user), many=True).data,
            'certificates': CertificateSerializer(Certificate.objects.filter(user=user), many=True).data,
        }
        return Response(data)
