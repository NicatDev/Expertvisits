from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import models
from apps.services.models import BookingRequest
import datetime

class BookingEventsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Returns confirmed bookings as FullCalendar events.
        """
        provider_id = request.query_params.get('provider_id')
        
        if provider_id:
            # Public view of a provider's schedule
            query = models.Q(status='confirmed', provider_id=provider_id)
            if request.user.is_authenticated:
                query |= models.Q(status='pending', provider_id=provider_id, customer=request.user)
            
            bookings = BookingRequest.objects.filter(query).select_related('customer', 'provider')
            is_owner = False
        else:
            # Private view
            user = self.request.user
            bookings = BookingRequest.objects.filter(
                models.Q(status='confirmed') | models.Q(status='pending')
            ).filter(
                models.Q(provider=user) | models.Q(customer=user)
            ).select_related('customer', 'provider')
            is_owner = True
        
        events = []
        user = request.user
        
        for b in bookings:
            start = b.requested_datetime
            end = start + datetime.timedelta(minutes=b.duration_minutes)
            
            title = "Busy"
            color = '#595959'

            if b.status == 'pending':
                color = '#fa8c16'
                title = "Request Pending"
            elif is_owner:
                if b.provider == user and b.customer == user:
                     title = "Blocked"
                     color = '#5E4F4C'
                else:
                     title = f"Meeting with {b.customer.first_name}" if b.provider == user else f"Meeting with {b.provider.first_name}"
                     color = '#52c41a'
            else:
                title = "Busy"
                color = '#595959'
            
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
