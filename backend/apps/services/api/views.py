from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
import datetime

from apps.services.models import Service, BookingRequest
from django.db import models
from apps.services.api.serializers import ServiceSerializer, BookingRequestSerializer

class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user) # Default to user service

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if self.action == 'list':
            role = self.request.query_params.get('role', 'customer')
            if role == 'provider':
                return BookingRequest.objects.filter(provider=user)
            return BookingRequest.objects.filter(customer=user)
            
        # For details and actions, allow if user involved
        return BookingRequest.objects.filter(models.Q(provider=user) | models.Q(customer=user))

    def perform_create(self, serializer):
        provider = serializer.validated_data.get('provider')
        customer = self.request.user
        
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
            bookings = BookingRequest.objects.filter(
                status='confirmed',
                provider_id=provider_id
            )
            is_owner = False
        else:
            # Private view for the logged-in user (my schedule)
            user = self.request.user
            bookings = BookingRequest.objects.filter(
                status='confirmed'
            ).filter(
                models.Q(provider=user) | models.Q(customer=user)
            )
            is_owner = True
        
        events = []
        for b in bookings:
            start = b.requested_datetime
            end = start + datetime.timedelta(minutes=b.duration_minutes)
            
            if is_owner:
                # Owners see details
                if b.provider == b.customer:
                     title = b.note if b.note else "Busy"
                elif user == b.provider:
                    title = f"Meeting with {b.customer.first_name} {b.customer.last_name}"
                else:
                    title = f"Meeting with {b.provider.first_name} {b.provider.last_name}"
                color = '#333333' if b.provider == b.customer else '#52c41a'
            else:
                # Public sees generic "Busy"
                title = "Busy"
                color = '#333333' # Black for busy/blocked
            
            events.append({
                'id': b.id,
                'title': title,
                'start': start.isoformat(),
                'end': end.isoformat(),
                'backgroundColor': color,
                'borderColor': color
                # Removed 'display': 'background' so it renders as a visible block
            })
            
        return Response(events)
