from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.connections.models import ConnectionRequest
from apps.connections.services import accept_request, decline_request
from apps.notifications.models import InboxNotification
from apps.notifications.realtime import push_payload
from apps.notifications.services import notify_connection_accepted


class AcceptConnectionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        req = get_object_or_404(
            ConnectionRequest,
            pk=pk,
            to_user=request.user,
            status=ConnectionRequest.Status.PENDING,
        )
        try:
            accept_request(req, request.user)
        except ValueError:
            return Response({"detail": "Invalid."}, status=status.HTTP_400_BAD_REQUEST)
        notify_connection_accepted(req)
        now = timezone.now()
        InboxNotification.objects.filter(
            connection_request=req, recipient=request.user, read_at__isnull=True
        ).update(read_at=now)
        push_payload(request.user.id, {"type": "badge_refresh"})
        push_payload(req.from_user_id, {"type": "badge_refresh"})
        return Response({"status": "accepted"})


class DeclineConnectionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        req = get_object_or_404(
            ConnectionRequest,
            pk=pk,
            to_user=request.user,
            status=ConnectionRequest.Status.PENDING,
        )
        try:
            decline_request(req, request.user)
        except ValueError:
            return Response({"detail": "Invalid."}, status=status.HTTP_400_BAD_REQUEST)
        now = timezone.now()
        InboxNotification.objects.filter(
            connection_request=req, recipient=request.user, read_at__isnull=True
        ).update(read_at=now)
        push_payload(request.user.id, {"type": "badge_refresh"})
        return Response({"status": "declined"})


class CancelOutgoingConnectionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        req = get_object_or_404(
            ConnectionRequest,
            pk=pk,
            from_user=request.user,
            status=ConnectionRequest.Status.PENDING,
        )
        req.status = ConnectionRequest.Status.DECLINED
        req.save(update_fields=["status"])
        InboxNotification.objects.filter(connection_request=req, recipient=req.to_user).delete()
        push_payload(req.to_user_id, {"type": "badge_refresh"})
        push_payload(request.user.id, {"type": "badge_refresh"})
        return Response({"status": "cancelled"})
