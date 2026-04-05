"""Fan-out chat-room events via the channel layer (same Redis as user inbox)."""

from __future__ import annotations

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from apps.chat.models import chat_room_group


def broadcast_chat_room_payload(room_id: int, payload: dict) -> None:
    """Deliver one JSON envelope to every socket subscribed to this room's group."""
    layer = get_channel_layer()
    if not layer:
        return
    async_to_sync(layer.group_send)(
        chat_room_group(room_id),
        {"type": "chat.message", "payload": payload},
    )
