from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.interactions.api.views import LikeViewSet, CommentViewSet

router = DefaultRouter()
router.register(r'likes', LikeViewSet)
router.register(r'comments', CommentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
