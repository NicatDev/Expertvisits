from django.contrib import admin

from .models import BookingRequest


@admin.register(BookingRequest)
class BookingRequestAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "provider",
        "customer",
        "requested_datetime",
        "duration_minutes",
        "status",
    )
    list_filter = ("status", "requested_datetime")
    search_fields = ("provider__username", "customer__username", "note")
    autocomplete_fields = ("provider", "customer")
    date_hierarchy = "requested_datetime"
