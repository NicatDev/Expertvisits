"""
Transactional email helpers. All user-facing copy is English only.

Subject/body style aims for clear, low-hype transactional mail (better inbox placement).
Use DEFAULT_FROM_EMAIL everywhere; ensure SPF/DKIM for your domain in production.
"""
import logging
import re

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone as django_timezone

logger = logging.getLogger(__name__)

_BRAND = "Expert Visits"
_SITE = "https://expertvisits.com"


def _sanitize_subject_fragment(text, max_length=72):
    """Single-line, trimmed subject fragment (visitor-supplied text, etc.)."""
    if not text:
        return "Message"
    s = re.sub(r"[\r\n]+", " ", str(text)).strip()
    s = re.sub(r"\s+", " ", s)
    if len(s) > max_length:
        return s[: max_length - 3].rstrip() + "..."
    return s


def send_verification_email(email, code):
    """
    One-time code after registration or resend.
    Code appears in the body only (not in the subject line).
    """
    subject = f"{_BRAND} — verify your email"
    message = (
        f"Hello,\n\n"
        f"You are completing signup for {_BRAND}. Enter this one-time verification code "
        f"on the site to confirm your email address:\n\n"
        f"  {code}\n\n"
        f"This code is for your account security. Do not share it with anyone.\n\n"
        f"If you did not try to create an account, you can ignore this message.\n\n"
        f"— {_BRAND}\n"
        f"{_SITE}\n"
    )
    return send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False,
    )


def send_email_change_verification_email(email, code):
    """
    One-time code to confirm a new address when changing account email (logged-in user).
    """
    subject = f"{_BRAND} — confirm your new email address"
    message = (
        f"Hello,\n\n"
        f"You asked to change the email address on your {_BRAND} account. "
        f"Enter this one-time code where prompted on the site:\n\n"
        f"  {code}\n\n"
        f"If you did not request this change, ignore this message and your email will stay the same.\n\n"
        f"— {_BRAND}\n"
        f"{_SITE}\n"
    )
    return send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False,
    )


def send_new_booking_request_notification(booking):
    """Notify the provider when another user submits a booking request."""
    provider = booking.provider
    customer = booking.customer
    to_email = (getattr(provider, "email", None) or "").strip()
    if not to_email:
        return

    dt_local = django_timezone.localtime(booking.requested_datetime)
    dt_str = dt_local.strftime("%Y-%m-%d %H:%M %Z")
    cust_name = f"{customer.first_name} {customer.last_name}".strip() or customer.username
    cust_email = (getattr(customer, "email", None) or "").strip() or "(not provided)"
    note = (booking.note or "").strip() or "—"
    meet = (booking.meet_link or "").strip() or "—"
    loc = (booking.location or "").strip() or "—"

    subject = f"{_BRAND} — meeting request from @{customer.username}"
    message = (
        f"Hello {provider.first_name or provider.username},\n\n"
        f"A member requested a meeting with you through your {_BRAND} profile.\n\n"
        f"Requested time\n"
        f"  {dt_str}\n"
        f"  Duration: {booking.duration_minutes} minutes\n\n"
        f"Details\n"
        f"  Note: {note}\n"
        f"  Meeting link: {meet}\n"
        f"  Location: {loc}\n\n"
        f"From\n"
        f"  Name: {cust_name}\n"
        f"  Username: @{customer.username}\n"
        f"  Email: {cust_email}\n\n"
        f"Sign in to {_BRAND} to accept or decline this request.\n"
        f"{_SITE}\n\n"
        f"— {_BRAND}\n"
    )

    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [to_email],
            fail_silently=False,
        )
    except Exception:
        logger.exception("Failed to send booking request notification to %s", to_email)


def send_portfolio_contact_email(owner_email, sender_name, sender_email, subject_line, body_text):
    """
    Contact form submission from a user's public portfolio site → owner's inbox.
    """
    safe_subj = _sanitize_subject_fragment(subject_line)
    subject = f"{_BRAND} portfolio — {safe_subj}"
    message = (
        f"You received a message through your {_BRAND} portfolio website.\n\n"
        f"From\n"
        f"  Name: {sender_name}\n"
        f"  Email: {sender_email}\n\n"
        f"Subject\n"
        f"  {safe_subj}\n\n"
        f"Message\n"
        f"{body_text.strip()}\n\n"
        f"— {_BRAND} (automated message)\n"
        f"{_SITE}\n"
    )
    return send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [owner_email],
        fail_silently=False,
    )
