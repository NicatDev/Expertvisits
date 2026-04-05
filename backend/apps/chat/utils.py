def canonical_pair(user_id_a: int, user_id_b: int) -> tuple[int, int, str]:
    if user_id_a == user_id_b:
        raise ValueError("Cannot chat with yourself")
    low, high = (user_id_a, user_id_b) if user_id_a < user_id_b else (user_id_b, user_id_a)
    return low, high, f"{low}_{high}"
