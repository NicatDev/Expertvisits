from django.db import models
from apps.accounts.models import User
from apps.business.models import Company

class Service(models.Model):
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE, related_name='services')
    company = models.ForeignKey(Company, null=True, blank=True, on_delete=models.CASCADE, related_name='services')
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    description = models.TextField()

    def __str__(self):
        return self.name

class BookingRequest(models.Model):
    STATUS_CHOICES = [('pending', 'Pending'), ('confirmed', 'Confirmed'), ('cancelled', 'Cancelled')]
    provider = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_bookings")
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="made_bookings")
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, blank=True) # Optional link to specific service
    requested_datetime = models.DateTimeField(db_index=True)
    duration_minutes = models.IntegerField(default=30)
    note = models.TextField(blank=True, null=True)
    status = models.CharField(choices=STATUS_CHOICES, default='pending', max_length=20)

    def __str__(self):
        return f"Booking with {self.provider.username} on {self.requested_datetime}"
