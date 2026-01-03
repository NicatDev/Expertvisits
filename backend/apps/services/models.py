from django.db import models
from apps.accounts.models import User
from apps.business.models import Company

class BookingRequest(models.Model):
    STATUS_CHOICES = [('pending', 'Pending'), ('confirmed', 'Confirmed'), ('cancelled', 'Cancelled')]
    provider = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_bookings")
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="made_bookings")
    # service field removed
    requested_datetime = models.DateTimeField(db_index=True)
    duration_minutes = models.IntegerField(default=30)
    note = models.TextField(blank=True, null=True)
    status = models.CharField(choices=STATUS_CHOICES, default='pending', max_length=20)

    def __str__(self):
        return f"Booking with {self.provider.username} on {self.requested_datetime}"
