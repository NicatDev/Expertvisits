from django.urls import path
from .views import UserWebsitePublicDetailView

urlpatterns = [
    path('<str:username>/', UserWebsitePublicDetailView.as_view(), name='user-website-detail'),
]
