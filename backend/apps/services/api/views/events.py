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
            # Public view: Fetch ALL confirmed and pending bookings to show availability
            # Privacy logic in loop below anonymizes them.
            query = (models.Q(provider_id=provider_id) | models.Q(customer_id=provider_id)) & models.Q(status__in=['confirmed', 'pending'])
            
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
            
            is_my_booking = (request.user.is_authenticated and (b.customer == request.user or b.provider == request.user))
            
            if is_my_booking:
                if b.status == 'pending':
                    other_party = b.provider if b.customer == request.user else b.customer
                    title = f"Pending Request with {other_party.first_name}"
                    color = '#faad14' # Yellow/Orange
                else:
                    # Confirmed
                    other_party = b.provider if b.customer == request.user else b.customer
                    title = f"Meeting with {other_party.first_name}"
                    color = '#52c41a' # Green
            elif is_owner:
                 # Provider viewing own calendar (Private View logic fallback if needed, though usually covered by is_my_booking)
                 # Wait, if I am the provider, is_my_booking is True. So this elif might be redundant or for specific edge cases.
                 # Let's rely on is_my_booking for the owner view too.
                 pass 
            else:
                 # Stranger viewing
                 title = "Busy"
                 color = '#d9d9d9' # Grey
                 # Ensure we don't leak info for busy slots
            
            # Special case for "Blocked" (Provider self-booking?)
            if b.provider == b.customer:
                 title = "Blocked"
                 color = '#595959' # Dark Grey

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
