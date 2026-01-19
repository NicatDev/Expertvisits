from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.response import Response
from django.contrib.contenttypes.models import ContentType
from apps.interactions.models import Like

class LikeToggleAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        model_name = request.data.get('model')
        object_id = request.data.get('object_id')
        
        if not model_name or not object_id:
             return Response({"error": "Missing params"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            ct = ContentType.objects.get(model=model_name.lower())
        except ContentType.DoesNotExist:
             return Response({"error": "Invalid model"}, status=status.HTTP_400_BAD_REQUEST)
        
        like = Like.objects.filter(content_type=ct, object_id=object_id, user=request.user).first()
        if like:
            like.delete()
            return Response({"liked": False})
        else:
            Like.objects.create(content_type=ct, object_id=object_id, user=request.user)
            return Response({"liked": True})

class LikeUsersAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        model_name = request.query_params.get('model')
        object_id = request.query_params.get('object_id')
        
        if not model_name or not object_id:
             return Response({"error": "Missing params"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            ct = ContentType.objects.get(model=model_name.lower())
        except ContentType.DoesNotExist:
             return Response({"error": "Invalid model"}, status=status.HTTP_400_BAD_REQUEST)
        
        likes = Like.objects.filter(content_type=ct, object_id=object_id).select_related('user')
        users_data = [{
            'username': l.user.username, 
            'avatar': l.user.avatar.url if l.user.avatar else None,
            'first_name': l.user.first_name,
            'last_name': l.user.last_name,
            'like_date': l.created_at
        } for l in likes]
        return Response(users_data)
