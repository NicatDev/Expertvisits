from rest_framework import generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import models
from apps.services.models import BookingRequest
from apps.services.api.serializers import BookingRequestSerializer
import datetime
from datetime import timedelta

from django.utils import timezone

class BookingListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = BookingRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Auto-expire pending bookings
        BookingRequest.objects.filter(status='pending', requested_datetime__lt=timezone.now()).update(status='missed')
        
        user = self.request.user
        qs = BookingRequest.objects.select_related('provider', 'customer')
        
        role = self.request.query_params.get('role', 'customer')
        if role == 'provider':
            qs = qs.filter(provider=user)
        else:
            qs = qs.filter(customer=user)
        
        # Status Filter
        status_param = self.request.query_params.get('status')
        if status_param:
            statuses = status_param.split(',')
            qs = qs.filter(status__in=statuses)
            
        # Exclude Self (Self-bookings)
        exclude_self = self.request.query_params.get('exclude_self')
        if exclude_self == 'true':
            qs = qs.exclude(customer=user)
        
        return qs.order_by('-requested_datetime')

    def perform_create(self, serializer):
        provider = serializer.validated_data.get('provider')
        customer = self.request.user
        request_start = serializer.validated_data.get('requested_datetime')
        duration = serializer.validated_data.get('duration_minutes', 30)
        request_end = request_start + timedelta(minutes=duration)

        # Check for overlaps
        day_start = request_start.replace(hour=0, minute=0, second=0)
        day_end = day_start + timedelta(days=1)
        
        existing_bookings = BookingRequest.objects.filter(
            provider=provider,
            status='confirmed',
            requested_datetime__range=(day_start, day_end)
        )
        
        for b in existing_bookings:
            b_start = b.requested_datetime
            b_end = b_start + timedelta(minutes=b.duration_minutes)
            
            if request_start < b_end and request_end > b_start:
                from rest_framework import serializers
                raise serializers.ValidationError({"non_field_errors": ["The selected time slot overlaps with an existing appointment."]})
        
        status_val = 'pending'
        if provider == customer:
            status_val = 'confirmed'
            
        serializer.save(customer=customer, status=status_val)

class BookingDetailManagerAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk):
        try:
            obj = BookingRequest.objects.select_related('provider', 'customer').get(pk=pk)
            # Permission check: must be provider or customer
            if obj.provider != self.request.user and obj.customer != self.request.user:
                 return None
            return obj
        except BookingRequest.DoesNotExist:
            return None

    def post(self, request, pk=None, action_type=None):
        booking = self.get_object(pk)
        if not booking:
             return Response({'error': 'Not found or permission denied'}, status=status.HTTP_404_NOT_FOUND)

        if action_type == 'accept':
            if booking.provider != request.user:
                return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
            booking.status = 'confirmed'
            booking.save()
            return Response({'status': 'confirmed'})
        
        elif action_type == 'reject':
            if booking.provider != request.user:
                return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
            booking.status = 'cancelled'
            booking.save()
            return Response({'status': 'cancelled'})
            
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request, pk=None):
        booking = self.get_object(pk)
        if not booking:
             return Response({'error': 'Not found or permission denied'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        
        if new_status == 'cancelled':
             # Both parties can cancel
             if booking.provider != request.user and booking.customer != request.user:
                 return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
             booking.status = 'cancelled'
             booking.save()
             return Response({'status': 'cancelled'})

        elif new_status == 'rejected':
             # Only provider can reject
             if booking.provider != request.user and booking.customer != request.user:
                 return Response({'error': 'Only provider or customer can reject'}, status=status.HTTP_403_FORBIDDEN)
             booking.status = 'cancelled' 
             booking.save()
             return Response({'status': 'cancelled'})
             
        return Response({'error': 'Invalid status update'}, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, pk=None):
         booking = self.get_object(pk)
         if not booking:
              return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
         serializer = BookingRequestSerializer(booking)
         return Response(serializer.data)
