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
        user_id = request.user.id if request.user.is_authenticated else None
        
        for b in bookings:
            start = b.requested_datetime
            end = start + datetime.timedelta(minutes=b.duration_minutes)
            
            # Use IDs for reliable comparison
            is_customer = (user_id and b.customer_id == user_id)
            is_provider = (user_id and b.provider_id == user_id)
            is_my_booking = is_customer or is_provider
            
            title = "Busy"
            color = '#d9d9d9' # Grey
            
            if is_my_booking:
                if b.status == 'pending':
                    color = '#fa8c16' # Orange/Yellow
                else:
                    color = '#52c41a' # Green

                if is_customer:
                    # I sent the request
                    title = f"To: {b.provider.first_name} {b.provider.last_name}"
                else:
                    # I received the request
                    title = f"From: {b.customer.first_name} {b.customer.last_name}"
            
            # Special case for "Blocked" (Provider self-booking?)
            if b.provider_id == b.customer_id:
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
                    'note': b.note,
                    'meet_link': b.meet_link,
                    'location': b.location,
                    'is_incoming': is_provider and not is_customer, # I am provider but not customer
                    'customer': b.customer_id
                }
            })
            
        return Response(events)
