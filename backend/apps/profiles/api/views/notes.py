from rest_framework import generics, permissions
from apps.profiles.models import QuickNote
from apps.profiles.api.serializers import QuickNoteSerializer

class QuickNoteListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = QuickNoteSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        user_id = self.request.query_params.get('user_id')
        if user_id:
             return QuickNote.objects.filter(user_id=user_id)
        if self.request.user.is_authenticated:
            return QuickNote.objects.filter(user=self.request.user)
        return QuickNote.objects.none()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class QuickNoteDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = QuickNote.objects.all()
    serializer_class = QuickNoteSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
