from django.conf import settings
from django.db import models


def user_ws_group(user_id: int) -> str:
    return f"user_{user_id}"


def chat_room_group(room_id: int) -> str:
    """Channels group for all WS clients subscribed to this 1:1 room (both participants)."""
    return f"chat_{room_id}"


class ChatRoom(models.Model):
    """
    1:1 room. user_low_id < user_high_id always; room_key = f"{low}_{high}" for stable idempotency.
    """

    user_low = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chat_rooms_low",
        db_index=True,
    )
    user_high = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chat_rooms_high",
        db_index=True,
    )
    room_key = models.CharField(max_length=32, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    last_message_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user_low", "user_high"],
                name="chat_chatroom_unique_pair",
            ),
            models.CheckConstraint(
                condition=models.Q(user_low_id__lt=models.F("user_high_id")),
                name="chat_chatroom_low_before_high",
            ),
        ]
        indexes = [
            models.Index(fields=["user_low", "-last_message_at"]),
            models.Index(fields=["user_high", "-last_message_at"]),
        ]

    def other_user_id(self, user_id: int) -> int:
        if user_id == self.user_low_id:
            return self.user_high_id
        return self.user_low_id

    def __str__(self):
        return self.room_key


class ChatMessage(models.Model):
    chat = models.ForeignKey(
        ChatRoom, on_delete=models.CASCADE, related_name="messages", db_index=True
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_chat_messages",
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_chat_messages",
        db_index=True,
    )
    text = models.TextField(max_length=8000)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        ordering = ["-id"]
        indexes = [
            models.Index(fields=["chat", "-id"]),
            models.Index(fields=["chat", "-created_at"]),
            models.Index(fields=["recipient", "read_at"]),
        ]

    def __str__(self):
        return f"{self.sender_id}->{self.recipient_id} @ {self.created_at}"


class ChatNotification(models.Model):
    class Kind(models.TextChoices):
        NEW_MESSAGE = "new_message", "New message"
        CHAT_REQUEST = "chat_request", "Chat / first message"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chat_notifications",
        db_index=True,
    )
    kind = models.CharField(max_length=32, choices=Kind.choices, db_index=True)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chat_notifications_sent",
    )
    chat = models.ForeignKey(
        ChatRoom, on_delete=models.CASCADE, null=True, blank=True, related_name="notifications"
    )
    message = models.ForeignKey(
        ChatMessage,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )
    payload = models.JSONField(default=dict, blank=True)
    read_at = models.DateTimeField(null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "-created_at"]),
            models.Index(fields=["recipient", "read_at", "-created_at"]),
        ]
