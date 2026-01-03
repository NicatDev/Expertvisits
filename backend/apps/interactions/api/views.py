from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.interactions.models import Like, Comment
from apps.interactions.api.serializers import LikeSerializer, CommentSerializer

class LikeViewSet(viewsets.ModelViewSet):
    queryset = Like.objects.all()
    serializer_class = LikeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def toggle(self, request):
        model_name = request.data.get('model')
        object_id = request.data.get('object_id')
        
        if not model_name or not object_id:
             return Response({"error": "Missing params"}, status=400)
        
        from django.contrib.contenttypes.models import ContentType
        try:
            ct = ContentType.objects.get(model=model_name.lower())
        except ContentType.DoesNotExist:
             return Response({"error": "Invalid model"}, status=400)
        
        # Check if exists
        like = Like.objects.filter(content_type=ct, object_id=object_id, user=request.user).first()
        if like:
            like.delete()
            return Response({"liked": False})
        else:
            Like.objects.create(content_type=ct, object_id=object_id, user=request.user)
            return Response({"liked": True})

    @action(detail=False, methods=['get'])
    def users(self, request):
        model_name = request.query_params.get('model') # article, quiz, etc.
        object_id = request.query_params.get('object_id')
        
        if not model_name or not object_id:
             return Response({"error": "Missing params"}, status=400)
        
        # Simple/Naive lookup. 
        # Ideally import ContentType.
        from django.contrib.contenttypes.models import ContentType
        try:
            ct = ContentType.objects.get(model=model_name.lower())
        except ContentType.DoesNotExist:
             return Response({"error": "Invalid model"}, status=400)
        
        likes = Like.objects.filter(content_type=ct, object_id=object_id).select_related('user')
        users_data = [{'username': l.user.username, 'avatar': l.user.avatar.url if l.user.avatar else None,'like_date': l.created_at} for l in likes]
        return Response(users_data)

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.select_related('user').all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        # Allow 'model' param in body to resolve content_type
        # serializer.save() will fail if content_type is missing.
        # We intercept validation or save. 
        # Better: doing it here.
        model_name = self.request.data.get('model')
        if model_name:
            from django.contrib.contenttypes.models import ContentType
            try:
                ct = ContentType.objects.get(model=model_name.lower())
                serializer.save(user=self.request.user, content_type=ct)
                return
            except ContentType.DoesNotExist:
                pass # Fallback to default if provided
        
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def for_object(self, request):
        model_name = request.query_params.get('model')
        object_id = request.query_params.get('object_id')
        
        if not model_name or not object_id:
             return Response({"error": "Missing params"}, status=400)

        from django.contrib.contenttypes.models import ContentType
        try:
            ct = ContentType.objects.get(model=model_name.lower())
        except ContentType.DoesNotExist:
             return Response({"error": "Invalid model"}, status=400)

        # Only fetch top-level comments (parent=None), createSerializer handles recursion
        comments = Comment.objects.filter(
            content_type=ct, 
            object_id=object_id, 
            parent__isnull=True
        ).select_related('user').prefetch_related('replies')
        
        serializer = self.get_serializer(comments, many=True)
        return Response(serializer.data)
