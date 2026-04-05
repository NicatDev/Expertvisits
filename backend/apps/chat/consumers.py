import json
import time

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from apps.chat.models import chat_room_group, user_ws_group
from apps.chat.services import create_message, mark_messages_read, relay_typing
from apps.chat.utils import chat_room_ids_for_user_ws, user_member_of_chat


class ChatConsumer(AsyncWebsocketConsumer):
    """
    Per socket: user_<id> (inbox) + chat_<roomId> for subscribed 1:1 rooms.
    Inbound: JSON {action, ...}. Outbound: inbox_push | chat_message room fan-out.
    """

    TYPING_MIN_INTERVAL = 2.0

    async def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close(code=4401)
            return
        self.user = user
        self.uid = user.id
        self.group_name = user_ws_group(self.uid)
        self.chat_room_groups = set()
        self._last_typing = 0.0

        await self.channel_layer.group_add(self.group_name, self.channel_name)

        room_ids = await database_sync_to_async(chat_room_ids_for_user_ws)(self.uid)
        for rid in room_ids:
            g = chat_room_group(rid)
            await self.channel_layer.group_add(g, self.channel_name)
            self.chat_room_groups.add(g)

        await self.accept()
        await self.send(
            text_data=json.dumps(
                {"type": "connected", "user_id": self.uid, "group": self.group_name}
            )
        )

    async def disconnect(self, code):
        for g in getattr(self, "chat_room_groups", ()):
            await self.channel_layer.group_discard(g, self.channel_name)
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self._err("invalid_json")
            return

        action = data.get("action")
        if action == "send_message":
            await self._handle_send(data)
        elif action == "typing":
            await self._handle_typing(data)
        elif action == "mark_read":
            await self._handle_mark_read(data)
        elif action == "subscribe_chat":
            await self._handle_subscribe_chat(data)
        else:
            await self._err("unknown_action", code=400)

    async def _handle_subscribe_chat(self, data):
        try:
            cid = int(data.get("chat_id"))
        except (TypeError, ValueError):
            return
        ok = await database_sync_to_async(user_member_of_chat)(self.uid, cid)
        if not ok:
            return
        g = chat_room_group(cid)
        await self.channel_layer.group_add(g, self.channel_name)
        self.chat_room_groups.add(g)

    async def _handle_send(self, data):
        chat_id = data.get("chat_id")
        text = data.get("text")
        try:
            cid = int(chat_id)
        except (TypeError, ValueError):
            await self._err("invalid_chat_id")
            return
        msg = await database_sync_to_async(create_message)(self.uid, cid, text or "")
        if not msg:
            await self._err("send_failed", code=403)
            return

    async def _handle_typing(self, data):
        now = time.monotonic()
        if now - self._last_typing < self.TYPING_MIN_INTERVAL:
            return
        self._last_typing = now
        try:
            cid = int(data.get("chat_id"))
        except (TypeError, ValueError):
            return
        typing = bool(data.get("typing", True))
        await database_sync_to_async(relay_typing)(self.uid, cid, typing)

    async def _handle_mark_read(self, data):
        try:
            cid = int(data.get("chat_id"))
        except (TypeError, ValueError):
            await self._err("invalid_chat_id")
            return
        raw = data.get("up_to_message_id")
        up_to = int(raw) if raw is not None and str(raw).isdigit() else None
        n = await database_sync_to_async(mark_messages_read)(self.uid, cid, up_to)
        await self.send(text_data=json.dumps({"type": "mark_read_ack", "chat_id": cid, "updated": n}))

    async def inbox_push(self, event):
        await self.send(text_data=json.dumps(event["payload"]))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event["payload"]))

    async def _err(self, code: str, **extra):
        await self.send(
            text_data=json.dumps({"type": "error", "code": code, **extra}),
        )
