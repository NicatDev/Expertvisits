from django.contrib.auth import get_user_model
from django.db.models import Count, F, Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from django.db.models import OuterRef, Subquery

from apps.chat.api.serializers import (
    ChatMessageSerializer,
    ChatRoomSerializer,
    CreateOrGetChatSerializer,
    UserSearchSerializer,
)
from apps.chat.models import ChatMessage, ChatRoom
from apps.chat.services import mark_messages_read

User = get_user_model()


class UserSearchListView(generics.ListAPIView):
    """GET /api/chat/search-users/?q=ali"""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSearchSerializer

    def get_queryset(self):
        q = (self.request.query_params.get("q") or "").strip()
        user = self.request.user
        qs = User.objects.exclude(pk=user.pk).filter(is_active=True)
        if hasattr(User, "is_searchable"):
            qs = qs.filter(is_searchable=True)
        if len(q) < 2:
            return qs.none()
        return qs.filter(
            Q(username__icontains=q)
            | Q(first_name__icontains=q)
            | Q(last_name__icontains=q)
            | Q(email__iexact=q)
        ).order_by("username")[:25]


class ChatRoomListView(generics.ListAPIView):
    """GET /api/chat/rooms/"""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChatRoomSerializer

    def get_queryset(self):
        u = self.request.user
        latest_txt = (
            ChatMessage.objects.filter(chat_id=OuterRef("pk"))
            .order_by("-id")
            .values("text")[:1]
        )
        return (
            ChatRoom.objects.filter(Q(user_low=u) | Q(user_high=u))
            .select_related("user_low", "user_high")
            .annotate(
                unread_count=Count(
                    "messages",
                    filter=Q(messages__recipient=u, messages__read_at__isnull=True),
                ),
                last_message_preview=Subquery(latest_txt),
            )
            .order_by(F("last_message_at").desc(nulls_last=True), "-created_at")
        )


class CreateOrGetChatView(APIView):
    """POST /api/chat/rooms/create-or-get/  body: {"user_id": 12}"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ser = CreateOrGetChatSerializer(data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)
        bundle = ser.create(ser.validated_data)
        room = bundle["room"]
        created = bundle["created"]
        return Response(
            {
                "chat_id": room.id,
                "room_key": room.room_key,
                "created": created,
                "room": ChatRoomSerializer(room, context={"request": request}).data,
            },
            status=status.HTTP_200_OK,
        )


class ChatMessageListView(APIView):
    """GET /api/chat/rooms/<chat_id>/messages/?before_id=&limit="""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        chat_id = int(kwargs["chat_id"])
        user = request.user
        room = (
            ChatRoom.objects.filter(pk=chat_id)
            .filter(Q(user_low=user) | Q(user_high=user))
            .first()
        )
        if not room:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        limit = min(int(request.query_params.get("limit", 30)), 100)
        before_id = request.query_params.get("before_id")
        qs = ChatMessage.objects.filter(chat_id=chat_id).order_by("-id")
        if before_id:
            try:
                qs = qs.filter(id__lt=int(before_id))
            except (TypeError, ValueError):
                pass
        messages = list(qs[:limit])
        messages.reverse()
        ser = ChatMessageSerializer(messages, many=True, context={"request": request})
        next_before_id = messages[0].id if messages else None
        return Response({"results": ser.data, "next_before_id": next_before_id})


class MarkMessagesReadView(APIView):
    """POST /api/chat/rooms/<chat_id>/read/  body: {"up_to_message_id": optional}"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, chat_id):
        uid = request.user.id
        raw = request.data.get("up_to_message_id")
        up_to = int(raw) if raw is not None and str(raw).isdigit() else None
        n = mark_messages_read(uid, int(chat_id), up_to)
        return Response({"updated": n})

