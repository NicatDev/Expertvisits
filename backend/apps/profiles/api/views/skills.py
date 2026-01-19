from rest_framework import generics, permissions
from apps.profiles.models import Skill
from apps.profiles.api.serializers import SkillSerializer

class SkillListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = SkillSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        user_id = self.request.query_params.get('user_id')
        if user_id:
             return Skill.objects.filter(user_id=user_id)
        if self.request.user.is_authenticated:
            return Skill.objects.filter(user=self.request.user)
        return Skill.objects.none()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class SkillDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
