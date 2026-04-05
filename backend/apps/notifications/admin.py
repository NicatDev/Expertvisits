from django.contrib import admin

from apps.notifications.models import InboxNotification


@admin.register(InboxNotification)
class InboxNotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "kind", "recipient", "actor", "read_at", "sort_weight", "created_at")
    list_filter = ("kind", "read_at")
