from django.conf import settings
from django.db import models


class InboxNotification(models.Model):
    """Unified inbox row: connection + chat; high sort_weight pinned (e.g. connection requests)."""

    class Kind(models.TextChoices):
        CONNECTION_REQUEST = "connection_request", "Connection request"
        CONNECTION_ACCEPTED = "connection_accepted", "Connection accepted"
        CHAT_REQUEST = "chat_request", "First chat message"
        CHAT_MESSAGE = "chat_message", "New chat message"
        VACANCY_APPLICATION = "vacancy_application", "Vacancy application"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="inbox_notifications",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="inbox_notifications_as_actor",
        null=True,
        blank=True,
    )
    kind = models.CharField(max_length=32, choices=Kind.choices, db_index=True)
    title = models.CharField(max_length=255, blank=True)
    body = models.TextField(blank=True)
    data = models.JSONField(default=dict, blank=True)
    read_at = models.DateTimeField(null=True, blank=True, db_index=True)
    sort_weight = models.SmallIntegerField(default=0, db_index=True)
    connection_request = models.ForeignKey(
        "connections.ConnectionRequest",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="inbox_items",
    )
    chat_message = models.ForeignKey(
        "chat.ChatMessage",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="inbox_items",
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-sort_weight", "-created_at"]
        indexes = [
            models.Index(fields=["recipient", "-sort_weight", "-created_at"]),
            models.Index(fields=["recipient", "read_at", "-created_at"]),
        ]
