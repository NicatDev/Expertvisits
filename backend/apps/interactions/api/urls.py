from django.urls import path, include
from .views.likes import LikeToggleAPIView, LikeUsersAPIView
from .views.comments import CommentListCreateAPIView, CommentDetailAPIView, CommentForObjectAPIView

urlpatterns = [
    path('likes/toggle/', LikeToggleAPIView.as_view(), name='like-toggle'),
    path('likes/users/', LikeUsersAPIView.as_view(), name='like-users'),
    
    path('comments/', CommentListCreateAPIView.as_view(), name='comment-list-create'),
    path('comments/<int:pk>/', CommentDetailAPIView.as_view(), name='comment-detail'),
    path('comments/for_object/', CommentForObjectAPIView.as_view(), name='comment-for-object'),
]
