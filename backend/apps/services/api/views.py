from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
import datetime

from apps.services.models import BookingRequest
from django.db import models
from apps.services.api.serializers import BookingRequestSerializer

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if self.action == 'list':
            qs = BookingRequest.objects.all()
            
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
            
        # For details and actions, allow if user involved
        return BookingRequest.objects.filter(models.Q(provider=user) | models.Q(customer=user))

    def perform_create(self, serializer):
        from rest_framework import serializers
        from datetime import timedelta
        
        provider = serializer.validated_data.get('provider')
        customer = self.request.user
        request_start = serializer.validated_data.get('requested_datetime')
        duration = serializer.validated_data.get('duration_minutes', 30)
        request_end = request_start + timedelta(minutes=duration)

        # Check for overlaps
        # Overlap if: (StartA < EndB) and (EndA > StartB)
        # We need to check against CONFIRMED bookings for this provider
        
        # Note: Ideally we should use database-level constraints or range fields (Postgres Tstzrange)
        # But for now, we iterate or use basic Q lookup. Since end_time isn't a column, we annotate or filter carefully.
        # Simple approach: Get all confirmed bookings for the day, check in python.
        
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
                raise serializers.ValidationError({"non_field_errors": ["The selected time slot overlaps with an existing appointment."]})
        
        status_val = 'pending'
        if provider == customer:
            status_val = 'confirmed'
            
        serializer.save(customer=customer, status=status_val)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        booking = self.get_object()
        if booking.provider != request.user:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        booking.status = 'confirmed'
        booking.save()
        return Response({'status': 'confirmed'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        booking = self.get_object()
        if booking.provider != request.user:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        booking.status = 'cancelled'
        booking.save()
        return Response({'status': 'cancelled'})

    @action(detail=False, methods=['get'])
    def events(self, request):
        """
        Returns confirmed bookings as FullCalendar events.
        """
        provider_id = request.query_params.get('provider_id')
        
        if provider_id:
            # Public view of a provider's schedule
            # 1. Confirmed bookings (Busy for everyone)
            query = models.Q(status='confirmed', provider_id=provider_id)
            
            # 2. My pending requests (Visible to me)
            if request.user.is_authenticated:
                query |= models.Q(status='pending', provider_id=provider_id, customer=request.user)
            
            bookings = BookingRequest.objects.filter(query)
            is_owner = False # Viewing someone else
        else:
            # Private view for the logged-in user (my schedule)
            user = self.request.user
            # Show both confirmed and pending for owner
            bookings = BookingRequest.objects.filter(
                models.Q(status='confirmed') | models.Q(status='pending')
            ).filter(
                models.Q(provider=user) | models.Q(customer=user)
            )
            is_owner = True
        
        events = []
        for b in bookings:
            start = b.requested_datetime
            end = start + datetime.timedelta(minutes=b.duration_minutes)
            
            title = "Busy" # Default
            color = '#595959' # Lighter black (Blocked)

            if b.status == 'pending':
                # Pending requests (Owner or Customer viewing their own)
                color = '#fa8c16'
                title = "Request Pending"
            elif is_owner:
                # Owners see details for confirmed
                if b.provider == user and b.customer == user:
                     title = "Blocked"
                else:
                     title = f"Meeting with {b.customer.first_name}" if b.provider == user else f"Meeting with {b.provider.first_name}"
                color = '#52c41a' # Green confirmed
            else:
                # Public sees generic "Busy"
                title = "Busy"
                color = '#595959' # Lighter black for busy
            
            events.append({
                'id': b.id,
                'title': title,
                'start': start.isoformat(),
                'end': end.isoformat(),
                'backgroundColor': color,
                'borderColor': color,
                'extendedProps': {
                    'status': b.status,
                    'note': b.note
                }
            })
            
        return Response(events)
