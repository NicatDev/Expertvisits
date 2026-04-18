from django.urls import path
from .views.users import (
    UserListCreateAPIView,
    UserRecommendedListAPIView,
    UserExpertListAPIView,
    UserDetailAPIView,
    UserMeAPIView,
    FollowAPIView,
    UnfollowAPIView,
    UserFollowersAPIView,
    UserFollowingAPIView,
)
from .views.categories import CategoryListAPIView, CategoryDetailAPIView
from .views.auth import VerifyEmailAPIView, CheckAvailabilityAPIView, ResendCodeAPIView, SetPasswordAPIView
from .views.email_change import RequestEmailChangeAPIView, ConfirmEmailChangeAPIView
from .views.profiles import UserProfileDetailsAPIView
from .views.google import GoogleAuthView

urlpatterns = [
    # User actions (must be before detail view to avoid conflict with username capture)
    path('users/me/', UserMeAPIView.as_view(), name='user-me'),
    path('users/set_password/', SetPasswordAPIView.as_view(), name='set-password'),
    path('users/request_email_change/', RequestEmailChangeAPIView.as_view(), name='request-email-change'),
    path('users/confirm_email_change/', ConfirmEmailChangeAPIView.as_view(), name='confirm-email-change'),
    path('users/check_availability/', CheckAvailabilityAPIView.as_view(), name='check-availability'),
    path('users/resend_code/', ResendCodeAPIView.as_view(), name='resend-code'),
    
    # User List and Detail
    path('users/recommended/', UserRecommendedListAPIView.as_view(), name='user-recommended-list'),
    path('users/experts/', UserExpertListAPIView.as_view(), name='user-experts-list'),
    path('users/', UserListCreateAPIView.as_view(), name='user-list'),
    path('users/<str:username>/', UserDetailAPIView.as_view(), name='user-detail'),
    
    # User Detail Actions
    path('users/<str:username>/follow/', FollowAPIView.as_view(), name='user-follow'),
    path('users/<str:username>/unfollow/', UnfollowAPIView.as_view(), name='user-unfollow'),
    path('users/<str:username>/followers/', UserFollowersAPIView.as_view(), name='user-followers'),
    path('users/<str:username>/following/', UserFollowingAPIView.as_view(), name='user-following'),

    # Categories
    path('categories/', CategoryListAPIView.as_view(), name='category-list'),
    path('categories/<int:pk>/', CategoryDetailAPIView.as_view(), name='category-detail'),

    # Auth & Profile
    path('verify-email/', VerifyEmailAPIView.as_view(), name='verify-email'),
    path('profile-details/', UserProfileDetailsAPIView.as_view(), name='profile-details'),
    path('google/', GoogleAuthView.as_view(), name='google-auth'),
]
