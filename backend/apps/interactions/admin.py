from django.contrib import admin

from .models import Comment, Like


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "content_type", "object_id", "created_at")
    list_filter = ("content_type", "created_at")
    search_fields = ("user__username",)
    autocomplete_fields = ("user",)
    raw_id_fields = ("content_type",)
    date_hierarchy = "created_at"


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "content_type", "object_id", "parent_id", "created_at")
    list_filter = ("content_type", "created_at")
    search_fields = ("user__username", "text")
    autocomplete_fields = ("user", "parent")
    raw_id_fields = ("content_type",)
    date_hierarchy = "created_at"
