# Real-time 1:1 chat — architecture (DRF + Channels + Redis + PostgreSQL)

## High-level design

| Layer | Role |
|--------|------|
| **REST (DRF + JWT)** | User search, create/get room, paginated history, notifications list, mark-read |
| **WebSocket (Daphne + Channels)** | Real-time delivery to `user_{id}` groups only (no global broadcast) |
| **Redis (`channels_redis`)** | Channel layer: group membership + pub/sub between workers |
| **PostgreSQL** | `ChatRoom`, `ChatMessage`, `ChatNotification` — source of truth |

Flow: client sends message over WS → consumer validates membership → `create_message()` persists → `group_send` to **receiver** (and `message_ack` to sender). Offline users have rows in DB; on reconnect, WS delivers new events; REST `/notifications/` and `/rooms/.../messages/` backfill.

## Room identity

- Canonical pair: `user_low_id < user_high_id` (DB `CheckConstraint`).
- `room_key = f"{low}_{high}"` — unique, stable for idempotent **create-or-get**.

## WebSocket protocol

**URL:** `wss://api.example.com/ws/chat/?token=<JWT_ACCESS>`

**Client → server (JSON):**

```json
{"action": "send_message", "chat_id": 1, "text": "Hello 👋"}
{"action": "typing", "chat_id": 1, "typing": true}
{"action": "mark_read", "chat_id": 1, "up_to_message_id": 42}
```

**Server → client:** `type` field distinguishes `message`, `message_ack`, `notification`, `typing`, `read_receipt`, `error`, `connected`.

## Security

- WS: `JWTAuthMiddleware` validates access token; anonymous connections closed.
- Every DB write checks `Q(user_low=u)|Q(user_high=u)` for the acting user.
- No client-supplied `recipient_id` on send — derived from room membership.

## REST endpoints (prefix `/api/chat/`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `search-users/?q=` | Search (min 2 chars), respects `is_searchable` |
| GET | `rooms/` | Inbox with `unread_count` |
| POST | `rooms/create-or-get/` | Body `{"user_id": N}` |
| GET | `rooms/<id>/messages/?before_id=&limit=` | Newest page first; older: `before_id` |
| POST | `rooms/<id>/read/` | Body optional `up_to_message_id` |
| GET | `notifications/?before_id=&limit=` | Paginated |
| PATCH | `notifications/read/` | `{"ids":[...]}` or `{"mark_all": true}` |

## Scaling & 8 GB RAM baseline

### WebSocket memory (order of magnitude)

- **Per connection:** ~30–120 KB in the event loop + TLS buffers; often **50–80 KB** practical average for plain JSON chat.
- **10k connections:** ~0.5–1.2 GB **only** for sockets; add **Django/ASGI workers**, **PostgreSQL** `shared_buffers`, **Redis**, **OS page cache**.

**Single 8 GB host (optimized baseline):**

- Run **1–2 Daphne/uvicorn worker processes** (not 8) to limit duplicate memory.
- **Redis** `maxmemory` + policy `allkeys-lru` for safety; channel layer uses short `expiry` (see `settings.CHANNEL_LAYERS`).
- **PostgreSQL:** `shared_buffers` ~1–1.5 GB, tune `max_connections` + **PgBouncer** in transaction mode for many clients.
- **CONN_MAX_AGE** modest or 0 behind PgBouncer.

### Redis strategy

- Use **separate logical DB** (`CHANNEL_LAYER_REDIS_URL`, e.g. `/2`) from Django cache to isolate eviction and memory spikes.
- Channel layer stores **short-lived channel/group metadata**, not chat history.
- `capacity` / `expiry` in `CHANNEL_LAYERS['default']['CONFIG']` cap backlog per channel.

### DB indexing (large history)

- `ChatMessage`: `(chat, -id)`, `(chat, -created_at)`, `(recipient, read_at)` — fast history + unread.
- `ChatRoom`: `(user_low, -last_message_at)`, `(user_high, -last_message_at)` — inbox sort.
- `ChatNotification`: `(recipient, -created_at)` + partial unread queries.

### Horizontal scaling

- **Multiple Daphne workers** behind a load balancer: all share the **same** `RedisChannelLayer` → `group_send` reaches the correct worker.
- **Sticky sessions not required** for WebSockets if using Redis channel layer (each worker subscribes to Redis).
- **PostgreSQL** remains single primary; read replicas optional for REST reads later.

## Bottlenecks to avoid

- Do **not** load full history in memory; use **keyset pagination** (`before_id`).
- Throttle **typing** events (consumer-side, ~2s) to cut Redis chatter.
- Avoid N+1 in inbox: `select_related('user_low','user_high')` + `annotate(unread_count=Count(...))`.
- Keep message payload small (text-only, max 8000 chars).

## Run commands

```bash
# HTTP + WS
daphne -b 0.0.0.0 -p 8001 config.asgi:application
```

Production often terminates TLS at nginx/caddy and proxies `Upgrade` headers to Daphne.
