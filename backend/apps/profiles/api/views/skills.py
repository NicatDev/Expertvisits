from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.profiles.models import Skill
from apps.profiles.api.serializers import SkillSerializer

class SkillListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = SkillSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        user_id = self.request.query_params.get('user_id')
        if user_id:
             return Skill.objects.filter(user_id=user_id).order_by('skill_type', 'sort_order', 'id')
        if self.request.user.is_authenticated:
            return Skill.objects.filter(user=self.request.user).order_by('skill_type', 'sort_order', 'id')
        return Skill.objects.none()

    def perform_create(self, serializer):
        skill_type = serializer.validated_data.get('skill_type')
        next_order = Skill.objects.filter(
            user=self.request.user,
            skill_type=skill_type,
        ).count()
        serializer.save(user=self.request.user, sort_order=next_order)

class SkillDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        if self.request.method in permissions.SAFE_METHODS:
            return Skill.objects.all()
        return Skill.objects.filter(user=self.request.user)


class SkillReorderAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        skill_type = request.data.get('skill_type')
        ordered_ids = request.data.get('ordered_ids') or []
        if skill_type not in ['hard', 'soft'] or not isinstance(ordered_ids, list):
            return Response({'detail': 'Invalid payload.'}, status=status.HTTP_400_BAD_REQUEST)

        ids = [int(item_id) for item_id in ordered_ids if str(item_id).isdigit()]
        skills = Skill.objects.filter(user=request.user, skill_type=skill_type, id__in=ids)
        skills_by_id = {skill.id: skill for skill in skills}
        for index, skill_id in enumerate(ids):
            skill = skills_by_id.get(skill_id)
            if skill:
                skill.sort_order = index
        Skill.objects.bulk_update(skills_by_id.values(), ['sort_order'])
        return Response({'status': 'updated'})
