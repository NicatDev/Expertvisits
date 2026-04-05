from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q

from apps.connections.models import ConnectionRequest

User = get_user_model()


def is_mutual_connection(a: User, b: User) -> bool:
    return a.following.filter(pk=b.pk).exists() and b.following.filter(pk=a.pk).exists()


@transaction.atomic
def accept_request(req: ConnectionRequest, accepter: User) -> ConnectionRequest:
    if req.to_user_id != accepter.pk or req.status != ConnectionRequest.Status.PENDING:
        raise ValueError("invalid_request")
    req.status = ConnectionRequest.Status.ACCEPTED
    req.save(update_fields=["status"])
    req.from_user.following.add(req.to_user)
    req.to_user.following.add(req.from_user)
    return req


@transaction.atomic
def decline_request(req: ConnectionRequest, user: User) -> None:
    if req.to_user_id != user.pk or req.status != ConnectionRequest.Status.PENDING:
        raise ValueError("invalid_request")
    req.status = ConnectionRequest.Status.DECLINED
    req.save(update_fields=["status"])


@transaction.atomic
def disconnect_users(a: User, b: User) -> None:
    a.following.remove(b)
    b.following.remove(a)
    ConnectionRequest.objects.filter(
        Q(from_user=a, to_user=b) | Q(from_user=b, to_user=a),
        status=ConnectionRequest.Status.PENDING,
    ).update(status=ConnectionRequest.Status.DECLINED)
