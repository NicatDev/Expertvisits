from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from apps.chat.models import user_ws_group


def push_payload(user_id: int, payload: dict) -> None:
    """Deliver JSON envelope to all WS tabs of this user (Redis channel layer)."""
    layer = get_channel_layer()
    if not layer:
        return
    async_to_sync(layer.group_send)(
        user_ws_group(user_id),
        {"type": "inbox.push", "payload": payload},
    )
