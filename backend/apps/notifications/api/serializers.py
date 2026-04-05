from rest_framework import serializers

from apps.notifications.models import InboxNotification


class InboxNotificationSerializer(serializers.ModelSerializer):
    actor_username = serializers.SerializerMethodField()
    actor_first_name = serializers.SerializerMethodField()
    actor_last_name = serializers.SerializerMethodField()
    actor_avatar = serializers.SerializerMethodField()
    actor_avatar_compressed = serializers.SerializerMethodField()

    class Meta:
        model = InboxNotification
        fields = (
            "id",
            "kind",
            "title",
            "body",
            "data",
            "read_at",
            "created_at",
            "sort_weight",
            "actor_id",
            "connection_request_id",
            "chat_message_id",
            "actor_username",
            "actor_first_name",
            "actor_last_name",
            "actor_avatar",
            "actor_avatar_compressed",
        )
        read_only_fields = fields

    def _actor(self, obj):
        return obj.actor

    def get_actor_username(self, obj):
        return obj.actor.username if obj.actor else None

    def get_actor_first_name(self, obj):
        return (obj.actor.first_name or "") if obj.actor else ""

    def get_actor_last_name(self, obj):
        return (obj.actor.last_name or "") if obj.actor else ""

    def _abs(self, file_field):
        if not file_field:
            return None
        request = self.context.get("request")
        url = file_field.url
        if request:
            return request.build_absolute_uri(url)
        return url

    def get_actor_avatar(self, obj):
        return self._abs(obj.actor.avatar) if obj.actor else None

    def get_actor_avatar_compressed(self, obj):
        return self._abs(obj.actor.avatar_compressed) if obj.actor else None


class MarkInboxReadSerializer(serializers.Serializer):
    ids = serializers.ListField(child=serializers.IntegerField(), required=False)
    mark_all = serializers.BooleanField(default=False)
