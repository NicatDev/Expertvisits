from django.contrib.auth import get_user_model
from django.db.models import Exists, OuterRef, Subquery

from apps.connections.models import ConnectionRequest

User = get_user_model()


def with_connection_annotations(queryset, user):
    if not user.is_authenticated:
        return queryset
    i_follow = User.following.through.objects.filter(
        from_user_id=user.id, to_user_id=OuterRef("pk")
    )
    follows_me = User.following.through.objects.filter(
        from_user_id=OuterRef("pk"), to_user_id=user.id
    )
    pout = ConnectionRequest.objects.filter(
        from_user_id=user.id,
        to_user_id=OuterRef("pk"),
        status=ConnectionRequest.Status.PENDING,
    )
    pin = ConnectionRequest.objects.filter(
        from_user_id=OuterRef("pk"),
        to_user_id=user.id,
        status=ConnectionRequest.Status.PENDING,
    )
    pout_id_sq = ConnectionRequest.objects.filter(
        from_user_id=user.id,
        to_user_id=OuterRef("pk"),
        status=ConnectionRequest.Status.PENDING,
    ).values("id")[:1]
    return queryset.annotate(
        conn_i_follow=Exists(i_follow),
        conn_follows_me=Exists(follows_me),
        conn_pending_out=Exists(pout),
        conn_pending_in=Exists(pin),
        conn_pending_out_id=Subquery(pout_id_sq),
    )
