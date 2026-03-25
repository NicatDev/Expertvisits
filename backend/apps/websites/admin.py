from django.contrib import admin
from .models import UserWebsite

@admin.register(UserWebsite)
class UserWebsiteAdmin(admin.ModelAdmin):
    list_display = ['user', 'template_id', 'is_active', 'is_deleted', 'created_at', 'updated_at']
    search_fields = ['user__username', 'user__email']
    list_filter = ['template_id', 'is_active', 'is_deleted']
