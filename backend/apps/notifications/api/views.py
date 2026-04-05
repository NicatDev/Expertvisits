from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.chat.models import ChatMessage
from apps.notifications.api.serializers import InboxNotificationSerializer, MarkInboxReadSerializer
from apps.notifications.models import InboxNotification
from apps.notifications.realtime import push_payload


class InboxSummaryView(APIView):
    """GET /api/notifications/summary/ — badge counts."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        notification_unread = InboxNotification.objects.filter(
            recipient=user, read_at__isnull=True
        ).count()
        chat_unread = ChatMessage.objects.filter(recipient=user, read_at__isnull=True).count()
        return Response(
            {
                "notification_unread": notification_unread,
                "chat_unread": chat_unread,
            }
        )


class InboxListView(APIView):
    """GET /api/notifications/inbox/?limit=&before_id="""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        limit = min(int(request.query_params.get("limit", 30)), 100)
        before_id = request.query_params.get("before_id")
        qs = (
            InboxNotification.objects.filter(recipient=user)
            .select_related("actor")
            .order_by("-sort_weight", "-id")
        )
        if before_id:
            try:
                qs = qs.filter(id__lt=int(before_id))
            except (TypeError, ValueError):
                pass
        items = list(qs[: limit + 1])
        has_more = len(items) > limit
        if has_more:
            items = items[:limit]
        ser = InboxNotificationSerializer(items, many=True, context={"request": request})
        next_before_id = items[-1].id if has_more and items else None
        return Response({"results": ser.data, "next_before_id": next_before_id})


class InboxMarkAllReadView(APIView):
    """POST /api/notifications/inbox/mark-all-read/ — e.g. when opening notifications page."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        now = timezone.now()
        n = InboxNotification.objects.filter(recipient=user, read_at__isnull=True).update(read_at=now)
        push_payload(user.id, {"type": "badge_refresh"})
        return Response({"updated": n})


class InboxNotificationDeleteView(APIView):
    """DELETE /api/notifications/inbox/<id>/ — remove one row for the current user."""

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        user = request.user
        deleted, _ = InboxNotification.objects.filter(recipient=user, pk=pk).delete()
        if not deleted:
            return Response(status=status.HTTP_404_NOT_FOUND)
        push_payload(user.id, {"type": "badge_refresh"})
        return Response(status=status.HTTP_204_NO_CONTENT)


class InboxMarkReadView(APIView):
    """PATCH /api/notifications/inbox/read/ — ids or mark_all."""

    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        ser = MarkInboxReadSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = request.user
        now = timezone.now()
        if ser.validated_data.get("mark_all"):
            n = InboxNotification.objects.filter(recipient=user, read_at__isnull=True).update(
                read_at=now
            )
            push_payload(user.id, {"type": "badge_refresh"})
            return Response({"updated": n})
        ids = ser.validated_data.get("ids") or []
        if not ids:
            return Response({"updated": 0})
        n = InboxNotification.objects.filter(
            recipient=user, id__in=ids, read_at__isnull=True
        ).update(read_at=now)
        push_payload(user.id, {"type": "badge_refresh"})
        return Response({"updated": n})
