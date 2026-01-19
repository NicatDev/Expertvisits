from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.bookings import BookingListCreateAPIView, BookingDetailManagerAPIView
from .views.events import BookingEventsAPIView

urlpatterns = [
    path('bookings/', BookingListCreateAPIView.as_view(), name='booking-list-create'),
    path('bookings/<int:pk>/', BookingDetailManagerAPIView.as_view(), name='booking-detail'), # GET details
    path('bookings/<int:pk>/<str:action_type>/', BookingDetailManagerAPIView.as_view(), name='booking-action'), # POST accept/reject
    path('bookings/events/', BookingEventsAPIView.as_view(), name='booking-events'),
]
