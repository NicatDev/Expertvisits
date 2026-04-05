from __future__ import annotations

from typing import Any

from django.contrib.auth import get_user_model

from apps.connections.models import ConnectionRequest
from apps.notifications.models import InboxNotification
from apps.notifications.realtime import push_payload
from core.utils.email import send_connection_request_email, send_vacancy_application_email

User = get_user_model()


def inbox_to_dict(n: InboxNotification, request=None) -> dict[str, Any]:
    actor = n.actor
    out = {
        "id": n.id,
        "kind": n.kind,
        "title": n.title,
        "body": n.body,
        "data": n.data,
        "read_at": n.read_at.isoformat() if n.read_at else None,
        "created_at": n.created_at.isoformat(),
        "sort_weight": n.sort_weight,
        "actor_id": n.actor_id,
        "connection_request_id": n.connection_request_id,
        "chat_message_id": n.chat_message_id,
        "chat_id": n.data.get("chat_id"),
    }
    if actor:
        out["actor_username"] = actor.username
        out["actor_first_name"] = actor.first_name or ""
        out["actor_last_name"] = actor.last_name or ""
        if actor.avatar:
            url = actor.avatar.url
            out["actor_avatar"] = request.build_absolute_uri(url) if request else url
        else:
            out["actor_avatar"] = None
        if actor.avatar_compressed:
            url = actor.avatar_compressed.url
            out["actor_avatar_compressed"] = request.build_absolute_uri(url) if request else url
        else:
            out["actor_avatar_compressed"] = None
    return out


def notify_connection_requested(req: ConnectionRequest) -> InboxNotification:
    target = req.to_user
    actor = req.from_user
    send_connection_request_email(req)
    n = InboxNotification.objects.create(
        recipient=target,
        actor=actor,
        kind=InboxNotification.Kind.CONNECTION_REQUEST,
        title="",
        body="",
        data={
            "from_user_id": actor.id,
            "username": actor.username,
        },
        sort_weight=100,
        connection_request=req,
    )
    push_payload(target.id, {"type": "inbox_notification", "notification": inbox_to_dict(n)})
    push_payload(target.id, {"type": "badge_refresh"})
    return n


def notify_vacancy_application(application_id: int) -> None:
    """Email + inbox row for the vacancy owner when a user submits an application."""
    from apps.business.models import VacancyApplication

    try:
        application = VacancyApplication.objects.select_related(
            "vacancy",
            "vacancy__company",
            "vacancy__company__owner",
            "vacancy__posted_by",
            "applicant",
        ).get(pk=application_id)
    except VacancyApplication.DoesNotExist:
        return

    vacancy = application.vacancy
    applicant = application.applicant
    owner = vacancy.posted_by
    if owner is None and vacancy.company_id:
        owner = vacancy.company.owner
    if owner is None or owner.id == applicant.id:
        return

    send_vacancy_application_email(application)

    preview = (application.motivation_letter or "").strip().replace("\n", " ")
    if len(preview) > 200:
        preview = preview[:197].rstrip() + "..."

    n = InboxNotification.objects.create(
        recipient=owner,
        actor=applicant,
        kind=InboxNotification.Kind.VACANCY_APPLICATION,
        title="",
        body=preview,
        data={
            "vacancy_id": vacancy.id,
            "vacancy_slug": vacancy.slug or "",
            "application_id": application.id,
        },
        sort_weight=40,
    )
    push_payload(owner.id, {"type": "inbox_notification", "notification": inbox_to_dict(n)})
    push_payload(owner.id, {"type": "badge_refresh"})


def notify_connection_accepted(req: ConnectionRequest) -> None:
    """Inform the original requester that connection was accepted."""
    actor = req.to_user
    recipient = req.from_user
    n = InboxNotification.objects.create(
        recipient=recipient,
        actor=actor,
        kind=InboxNotification.Kind.CONNECTION_ACCEPTED,
        title="",
        body="",
        data={"user_id": actor.id, "username": actor.username},
        sort_weight=50,
        connection_request=req,
    )
    push_payload(recipient.id, {"type": "inbox_notification", "notification": inbox_to_dict(n)})
    push_payload(recipient.id, {"type": "badge_refresh"})
