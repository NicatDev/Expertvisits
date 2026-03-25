from django.urls import path
from .views import (
    UserWebsitePublicDetailView, UserArticlesPublicListView, 
    UserWebsiteContactAPIView, UserArticlePublicDetailView,
    UserWebsiteManageAPIView
)

urlpatterns = [
    path('', UserWebsiteManageAPIView.as_view(), name='manage-website'),
    path('<str:username>/', UserWebsitePublicDetailView.as_view(), name='user-website-detail'),
    path('<str:username>/articles/', UserArticlesPublicListView.as_view(), name='user-website-articles'),
    path('<str:username>/articles/<str:slug>/', UserArticlePublicDetailView.as_view(), name='user-website-article-detail'),
    path('<str:username>/contact/', UserWebsiteContactAPIView.as_view(), name='user-website-contact'),
]
