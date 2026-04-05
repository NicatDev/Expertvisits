"""
JWT from WebSocket query string: /ws/chat/?token=<access_jwt>
"""
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken


@database_sync_to_async
def _user_from_token(token_str: str):
    from django.contrib.auth import get_user_model

    User = get_user_model()
    try:
        valid = AccessToken(token_str)
        uid = valid.get("user_id")
        if uid is None:
            return AnonymousUser()
        return User.objects.get(pk=uid)
    except (User.DoesNotExist, TokenError, InvalidToken, KeyError):
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        scope["user"] = AnonymousUser()
        qs = parse_qs(scope.get("query_string", b"").decode())
        token_list = qs.get("token") or qs.get("access")
        if token_list:
            token = token_list[0]
            if token:
                scope["user"] = await _user_from_token(token)
        return await super().__call__(scope, receive, send)
