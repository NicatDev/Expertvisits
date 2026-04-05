# Generated manually for apps.chat — run `makemigrations` on server if needed.

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ChatRoom",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("room_key", models.CharField(db_index=True, max_length=32, unique=True)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("last_message_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                (
                    "user_high",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="chat_rooms_high",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "user_low",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="chat_rooms_low",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="ChatMessage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("text", models.TextField(max_length=8000)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("read_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                (
                    "chat",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="messages",
                        to="chat.chatroom",
                    ),
                ),
                (
                    "recipient",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="received_chat_messages",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "sender",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="sent_chat_messages",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ["-id"]},
        ),
        migrations.CreateModel(
            name="ChatNotification",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "kind",
                    models.CharField(
                        choices=[("new_message", "New message"), ("chat_request", "Chat / first message")],
                        db_index=True,
                        max_length=32,
                    ),
                ),
                ("payload", models.JSONField(blank=True, default=dict)),
                ("read_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                (
                    "actor",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="chat_notifications_sent",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "chat",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notifications",
                        to="chat.chatroom",
                    ),
                ),
                (
                    "message",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="notifications",
                        to="chat.chatmessage",
                    ),
                ),
                (
                    "recipient",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="chat_notifications",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddConstraint(
            model_name="chatroom",
            constraint=models.UniqueConstraint(fields=("user_low", "user_high"), name="chat_chatroom_unique_pair"),
        ),
        migrations.AddConstraint(
            model_name="chatroom",
            constraint=models.CheckConstraint(
                check=models.Q(user_low_id__lt=models.F("user_high_id")),
                name="chat_chatroom_low_before_high",
            ),
        ),
        migrations.AddIndex(
            model_name="chatroom",
            index=models.Index(fields=["user_low", "-last_message_at"], name="chat_chatro_user_lo_7d0ea9_idx"),
        ),
        migrations.AddIndex(
            model_name="chatroom",
            index=models.Index(fields=["user_high", "-last_message_at"], name="chat_chatro_user_hi_8e1aa0_idx"),
        ),
        migrations.AddIndex(
            model_name="chatmessage",
            index=models.Index(fields=["chat", "-id"], name="chat_chatme_chat_id_3a9f1d_idx"),
        ),
        migrations.AddIndex(
            model_name="chatmessage",
            index=models.Index(fields=["chat", "-created_at"], name="chat_chatme_chat_id_4b8e2e_idx"),
        ),
        migrations.AddIndex(
            model_name="chatmessage",
            index=models.Index(fields=["recipient", "read_at"], name="chat_chatme_recipie_5c7f3f_idx"),
        ),
        migrations.AddIndex(
            model_name="chatnotification",
            index=models.Index(fields=["recipient", "-created_at"], name="chat_chatno_recipie_6d8e4e_idx"),
        ),
        migrations.AddIndex(
            model_name="chatnotification",
            index=models.Index(
                fields=["recipient", "read_at", "-created_at"], name="chat_chatno_recipie_7e9f5f_idx"
            ),
        ),
    ]
