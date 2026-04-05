from django.contrib import admin

from apps.connections.models import ConnectionRequest


@admin.register(ConnectionRequest)
class ConnectionRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "from_user", "to_user", "status", "created_at")
    list_filter = ("status",)
