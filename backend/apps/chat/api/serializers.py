from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.chat.models import ChatMessage, ChatRoom
from apps.chat.services import get_or_create_room

User = get_user_model()


class UserSearchSerializer(serializers.ModelSerializer):
    """Search card: name, surname, profile image (full + compressed URLs)."""

    name = serializers.CharField(source="first_name", read_only=True)
    surname = serializers.CharField(source="last_name", read_only=True)
    profile_image = serializers.SerializerMethodField()
    profile_image_compressed = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "username", "name", "surname", "profile_image", "profile_image_compressed")

    def _abs(self, file_field):
        if not file_field:
            return None
        request = self.context.get("request")
        url = file_field.url
        if request:
            return request.build_absolute_uri(url)
        return url

    def get_profile_image(self, obj):
        return self._abs(obj.avatar)

    def get_profile_image_compressed(self, obj):
        return self._abs(obj.avatar_compressed)


class ChatRoomSerializer(serializers.ModelSerializer):
    other_user = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    last_message_preview = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = (
            "id",
            "room_key",
            "other_user",
            "last_message_at",
            "created_at",
            "unread_count",
            "last_message_preview",
        )
        read_only_fields = (
            "id",
            "room_key",
            "other_user",
            "last_message_at",
            "created_at",
            "unread_count",
            "last_message_preview",
        )

    def get_unread_count(self, obj):
        return getattr(obj, "unread_count", 0)

    def get_last_message_preview(self, obj):
        return getattr(obj, "last_message_preview", "") or ""

    def get_other_user(self, obj):
        request = self.context.get("request")
        uid = request.user.id if request and request.user.is_authenticated else None
        if uid is None:
            return None
        other = obj.user_high if uid == obj.user_low_id else obj.user_low
        return UserSearchSerializer(other, context=self.context).data


class CreateOrGetChatSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(min_value=1)

    def validate_user_id(self, value):
        request = self.context["request"]
        if value == request.user.id:
            raise serializers.ValidationError("Cannot start chat with yourself.")
        if not User.objects.filter(pk=value).exists():
            raise serializers.ValidationError("User not found.")
        return value

    def create(self, validated_data):
        request = self.context["request"]
        room, created = get_or_create_room(request.user.id, validated_data["user_id"])
        return {"room": room, "created": created}


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = (
            "id",
            "chat_id",
            "sender_id",
            "recipient_id",
            "text",
            "created_at",
            "read_at",
        )
        read_only_fields = fields

