"""
Chat persistence + room-scoped realtime (channel layer groups chat_<room_id>).
User-scoped inbox (badge, inbox rows, typing, read receipt to peer) uses notifications.realtime.push_payload.
"""

from __future__ import annotations

from typing import Any

from django.db import transaction
from django.db.models import Max, Q
from django.utils import timezone

from apps.chat.models import ChatMessage, ChatRoom
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

    room_id = room.pk
    line = message_to_dict(msg)

    def _fanout():
        from apps.chat.realtime import broadcast_chat_room_payload

        broadcast_chat_room_payload(room_id, {"type": "chat_message", "message": line})

    transaction.on_commit(_fanout)
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
    if updated:
        from apps.notifications.models import InboxNotification

        InboxNotification.objects.filter(
            recipient_id=reader_id,
            read_at__isnull=True,
            chat_message__chat_id=chat_id,
        ).update(read_at=now)

    if not updated:
        return 0

    peer_id = room.other_user_id(reader_id)

    def _fanout():
        from apps.notifications.realtime import push_payload

        if max_id:
            push_payload(
                peer_id,
                {
                    "type": "read_receipt",
                    "chat_id": chat_id,
                    "message_id": max_id,
                    "reader_id": reader_id,
                },
            )
        push_payload(reader_id, {"type": "badge_refresh"})

    transaction.on_commit(_fanout)
    return updated


def relay_typing(sender_id: int, chat_id: int, typing: bool) -> bool:
    room = (
        ChatRoom.objects.filter(pk=chat_id)
        .filter(Q(user_low_id=sender_id) | Q(user_high_id=sender_id))
        .first()
    )
    if not room:
        return False
    peer_id = room.other_user_id(sender_id)
    from apps.notifications.realtime import push_payload

    push_payload(
        peer_id,
        {
            "type": "typing",
            "chat_id": chat_id,
            "user_id": sender_id,
            "typing": bool(typing),
        },
    )
    return True
