from django.contrib import admin

from apps.chat.models import ChatMessage, ChatNotification, ChatRoom


@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ("id", "room_key", "user_low", "user_high", "last_message_at", "created_at")
    search_fields = ("room_key",)


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ("id", "chat", "sender", "recipient", "created_at", "read_at")
    list_filter = ("created_at",)


@admin.register(ChatNotification)
class ChatNotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "kind", "recipient", "actor", "read_at", "created_at")
    list_filter = ("kind", "created_at")
