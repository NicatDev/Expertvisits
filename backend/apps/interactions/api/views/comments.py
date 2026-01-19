from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from django.contrib.contenttypes.models import ContentType
from apps.interactions.models import Comment
from apps.interactions.api.serializers import CommentSerializer

class CommentListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
         return Comment.objects.none() 

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        model_name = request.data.get('model')
        if model_name:
            try:
                ct = ContentType.objects.get(model=model_name.lower())
                serializer.save(user=request.user, content_type=ct)
            except ContentType.DoesNotExist:
                serializer.save(user=request.user)
        else:
             serializer.save(user=request.user)
             
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class CommentDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Comment.objects.select_related('user')
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def perform_destroy(self, instance):
        if instance.user != self.request.user:
             return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        instance.delete()
        
    def perform_update(self, serializer):
        if self.get_object().user != self.request.user:
             raise serializers.ValidationError("Permission denied")
        serializer.save()

class CommentForObjectAPIView(generics.ListAPIView):
    serializer_class = CommentSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        model_name = self.request.query_params.get('model')
        object_id = self.request.query_params.get('object_id')
        
        if not model_name or not object_id:
             return Comment.objects.none()

        try:
            ct = ContentType.objects.get(model=model_name.lower())
        except ContentType.DoesNotExist:
             return Comment.objects.none()

        queryset = Comment.objects.filter(
            content_type=ct, 
            object_id=object_id, 
            parent__isnull=True
        ).select_related('user').prefetch_related(
            'replies', 
            'replies__user', 
            'replies__likes', 
            'replies__replies', 
            'replies__replies__user'
        ).order_by('-created_at')
        
        return queryset
