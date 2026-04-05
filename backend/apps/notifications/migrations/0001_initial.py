import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("connections", "0001_initial"),
        ("chat", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="InboxNotification",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "kind",
                    models.CharField(
                        choices=[
                            ("connection_request", "Connection request"),
                            ("connection_accepted", "Connection accepted"),
                            ("chat_request", "First chat message"),
                            ("chat_message", "New chat message"),
                        ],
                        db_index=True,
                        max_length=32,
                    ),
                ),
                ("title", models.CharField(blank=True, max_length=255)),
                ("body", models.TextField(blank=True)),
                ("data", models.JSONField(blank=True, default=dict)),
                ("read_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("sort_weight", models.SmallIntegerField(db_index=True, default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                (
                    "actor",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="inbox_notifications_as_actor",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "chat_message",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="inbox_items",
                        to="chat.chatmessage",
                    ),
                ),
                (
                    "connection_request",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="inbox_items",
                        to="connections.connectionrequest",
                    ),
                ),
                (
                    "recipient",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="inbox_notifications",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ["-sort_weight", "-created_at"]},
        ),
        migrations.AddIndex(
            model_name="inboxnotification",
            index=models.Index(
                fields=["recipient", "-sort_weight", "-created_at"],
                name="notif_recipient_sort_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="inboxnotification",
            index=models.Index(
                fields=["recipient", "read_at", "-created_at"],
                name="notif_recipient_read_idx",
            ),
        ),
    ]
