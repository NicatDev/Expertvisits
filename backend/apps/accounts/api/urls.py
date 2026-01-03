from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.accounts.api.views import UserViewSet, CategoryViewSet, VerifyEmailView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'categories', CategoryViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
]
