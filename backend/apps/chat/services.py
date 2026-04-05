"""
Sync services: DB writes + targeted Redis channel layer fan-out.
Called from WebSocket consumer via database_sync_to_async.
"""
from __future__ import annotations

from typing import Any

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db import transaction
from django.db.models import Max, Q
from django.utils import timezone

from apps.chat.models import ChatMessage, ChatNotification, ChatRoom, user_ws_group
from apps.chat.utils import canonical_pair


def message_to_dict(m: ChatMessage) -> dict[str, Any]:
    return {
        "id": m.id,
        "chat_id": m.chat_id,
        "sender_id": m.sender_id,
        "recipient_id": m.recipient_id,
        "text": m.text,
        "created_at": m.created_at.isoformat(),
        "read_at": m.read_at.isoformat() if m.read_at else None,
    }


def notification_to_dict(n: ChatNotification) -> dict[str, Any]:
    return {
        "id": n.id,
        "kind": n.kind,
        "actor_id": n.actor_id,
        "chat_id": n.chat_id,
        "message_id": n.message_id,
        "payload": n.payload,
        "read_at": n.read_at.isoformat() if n.read_at else None,
        "created_at": n.created_at.isoformat(),
    }


def _group_send_user(user_id: int, payload: dict) -> None:
    layer = get_channel_layer()
    if not layer:
        return
    async_to_sync(layer.group_send)(
        user_ws_group(user_id),
        {"type": "chat.event", "payload": payload},
    )


def get_or_create_room(user_id: int, other_user_id: int) -> tuple[ChatRoom, bool]:
    low, high, room_key = canonical_pair(user_id, other_user_id)
    room, created = ChatRoom.objects.get_or_create(
        room_key=room_key,
        defaults={"user_low_id": low, "user_high_id": high},
    )
    return room, created


@transaction.atomic
def create_message(sender_id: int, chat_id: int, text: str) -> ChatMessage | None:
    text = (text or "").strip()
    if not text or len(text) > 8000:
        return None

    room = (
        ChatRoom.objects.select_for_update()
        .filter(pk=chat_id)
        .filter(Q(user_low_id=sender_id) | Q(user_high_id=sender_id))
        .first()
    )
    if not room:
        return None

    recipient_id = room.other_user_id(sender_id)
    msg = ChatMessage.objects.create(
        chat=room,
        sender_id=sender_id,
        recipient_id=recipient_id,
        text=text,
    )
    ChatRoom.objects.filter(pk=room.pk).update(last_message_at=msg.created_at)

    prior_count = ChatMessage.objects.filter(chat=room).exclude(pk=msg.pk).count()
    is_first = prior_count == 0

    kind = (
        ChatNotification.Kind.CHAT_REQUEST
        if is_first
        else ChatNotification.Kind.NEW_MESSAGE
    )
    notif = ChatNotification.objects.create(
        recipient_id=recipient_id,
        kind=kind,
        actor_id=sender_id,
        chat=room,
        message=msg,
        payload={"preview": text[:200]},
    )

    _group_send_user(
        recipient_id,
        {"type": "message", "message": message_to_dict(msg)},
    )
    _group_send_user(
        recipient_id,
        {"type": "notification", "notification": notification_to_dict(notif)},
    )
    _group_send_user(
        sender_id,
        {"type": "message_ack", "message": message_to_dict(msg)},
    )

    return msg


@transaction.atomic
def mark_messages_read(reader_id: int, chat_id: int, up_to_message_id: int | None) -> int:
    room = (
        ChatRoom.objects.filter(pk=chat_id)
        .filter(Q(user_low_id=reader_id) | Q(user_high_id=reader_id))
        .first()
    )
    if not room:
        return 0

    qs = ChatMessage.objects.filter(chat=room, recipient_id=reader_id, read_at__isnull=True)
    if up_to_message_id:
        qs = qs.filter(id__lte=up_to_message_id)
    max_id = qs.aggregate(m=Max("id"))["m"]
    now = timezone.now()
    updated = qs.update(read_at=now)
    if updated and max_id:
        peer_id = room.other_user_id(reader_id)
        _group_send_user(
            peer_id,
            {
                "type": "read_receipt",
                "chat_id": chat_id,
                "message_id": max_id,
                "reader_id": reader_id,
            },
        )
    return updated


def relay_typing(sender_id: int, chat_id: int, typing: bool) -> bool:
    room = (
        ChatRoom.objects.filter(pk=chat_id)
        .filter(Q(user_low_id=sender_id) | Q(user_high_id=sender_id))
        .first()
    )
    if not room:
        return False
    peer = room.other_user_id(sender_id)
    _group_send_user(
        peer,
        {
            "type": "typing",
            "chat_id": chat_id,
            "user_id": sender_id,
            "typing": bool(typing),
        },
    )
    return True
