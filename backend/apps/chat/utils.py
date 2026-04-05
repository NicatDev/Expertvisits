from django.db.models import F, Q

from apps.chat.models import ChatRoom


def canonical_pair(user_id_a: int, user_id_b: int) -> tuple[int, int, str]:
    if user_id_a == user_id_b:
        raise ValueError("Cannot chat with yourself")
    low, high = (user_id_a, user_id_b) if user_id_a < user_id_b else (user_id_b, user_id_a)
    return low, high, f"{low}_{high}"


def chat_room_ids_for_user_ws(user_id: int, limit: int = 120) -> list[int]:
    """Recent 1:1 rooms to subscribe on connect (bounded for scale)."""
    return list(
        ChatRoom.objects.filter(Q(user_low_id=user_id) | Q(user_high_id=user_id))
        .order_by(F("last_message_at").desc(nulls_last=True), "-id")
        .values_list("id", flat=True)[:limit]
    )


def user_member_of_chat(user_id: int, chat_id: int) -> bool:
    return (
        ChatRoom.objects.filter(pk=chat_id)
        .filter(Q(user_low_id=user_id) | Q(user_high_id=user_id))
        .exists()
    )
