from django.urls import path
from .views import UserWebsitePublicDetailView, UserArticlesPublicListView, UserWebsiteContactAPIView

urlpatterns = [
    path('<str:username>/', UserWebsitePublicDetailView.as_view(), name='user-website-detail'),
    path('<str:username>/articles/', UserArticlesPublicListView.as_view(), name='user-website-articles'),
    path('<str:username>/contact/', UserWebsiteContactAPIView.as_view(), name='user-website-contact'),
]
