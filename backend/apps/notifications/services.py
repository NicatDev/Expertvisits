from __future__ import annotations

from typing import Any

from django.contrib.auth import get_user_model

from apps.connections.models import ConnectionRequest
from apps.notifications.models import InboxNotification
from apps.notifications.realtime import push_payload

User = get_user_model()


def inbox_to_dict(n: InboxNotification, request=None) -> dict[str, Any]:
    actor = n.actor
    out = {
        "id": n.id,
        "kind": n.kind,
        "title": n.title,
        "body": n.body,
        "data": n.data,
        "read_at": n.read_at.isoformat() if n.read_at else None,
        "created_at": n.created_at.isoformat(),
        "sort_weight": n.sort_weight,
        "actor_id": n.actor_id,
        "connection_request_id": n.connection_request_id,
        "chat_message_id": n.chat_message_id,
        "chat_id": n.data.get("chat_id"),
    }
    if actor:
        out["actor_username"] = actor.username
        out["actor_first_name"] = actor.first_name or ""
        out["actor_last_name"] = actor.last_name or ""
        if actor.avatar:
            url = actor.avatar.url
            out["actor_avatar"] = request.build_absolute_uri(url) if request else url
        else:
            out["actor_avatar"] = None
        if actor.avatar_compressed:
            url = actor.avatar_compressed.url
            out["actor_avatar_compressed"] = request.build_absolute_uri(url) if request else url
        else:
            out["actor_avatar_compressed"] = None
    return out


def notify_connection_requested(req: ConnectionRequest) -> InboxNotification:
    target = req.to_user
    actor = req.from_user
    n = InboxNotification.objects.create(
        recipient=target,
        actor=actor,
        kind=InboxNotification.Kind.CONNECTION_REQUEST,
        title="",
        body="",
        data={
            "from_user_id": actor.id,
            "username": actor.username,
        },
        sort_weight=100,
        connection_request=req,
    )
    push_payload(target.id, {"type": "inbox_notification", "notification": inbox_to_dict(n)})
    push_payload(target.id, {"type": "badge_refresh"})
    return n


def notify_connection_accepted(req: ConnectionRequest) -> None:
    """Inform the original requester that connection was accepted."""
    actor = req.to_user
    recipient = req.from_user
    n = InboxNotification.objects.create(
        recipient=recipient,
        actor=actor,
        kind=InboxNotification.Kind.CONNECTION_ACCEPTED,
        title="",
        body="",
        data={"user_id": actor.id, "username": actor.username},
        sort_weight=50,
        connection_request=req,
    )
    push_payload(recipient.id, {"type": "inbox_notification", "notification": inbox_to_dict(n)})
    push_payload(recipient.id, {"type": "badge_refresh"})


def notify_new_chat_message(*, msg, is_first: bool) -> InboxNotification:
    recipient_id = msg.recipient_id
    kind = (
        InboxNotification.Kind.CHAT_REQUEST if is_first else InboxNotification.Kind.CHAT_MESSAGE
    )
    preview = (msg.text or "")[:200]
    n = InboxNotification.objects.create(
        recipient_id=recipient_id,
        actor_id=msg.sender_id,
        kind=kind,
        title="",
        body=preview,
        data={"chat_id": msg.chat_id, "preview": preview},
        sort_weight=10,
        chat_message=msg,
    )
    push_payload(
        recipient_id,
        {
            "type": "chat_message",
            "message": {
                "id": msg.id,
                "chat_id": msg.chat_id,
                "sender_id": msg.sender_id,
                "recipient_id": msg.recipient_id,
                "text": msg.text,
                "created_at": msg.created_at.isoformat(),
                "read_at": None,
            },
        },
    )
    push_payload(
        recipient_id,
        {"type": "inbox_notification", "notification": inbox_to_dict(n)},
    )
    push_payload(recipient_id, {"type": "badge_refresh"})
    push_payload(recipient_id, {"type": "chat_rooms_refresh"})
    return n
