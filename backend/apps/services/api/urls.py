from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.services.api.views import ServiceViewSet, BookingViewSet

router = DefaultRouter()
router.register(r'services', ServiceViewSet)
router.register(r'bookings', BookingViewSet, basename='booking')

urlpatterns = [
    path('', include(router.urls)),
]
