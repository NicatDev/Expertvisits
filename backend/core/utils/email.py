"""
Transactional email helpers. All user-facing copy is English only.

Subject/body style aims for clear, low-hype transactional mail (better inbox placement).
Use DEFAULT_FROM_EMAIL everywhere; ensure SPF/DKIM for your domain in production.
"""
import logging
import re

from django.conf import settings
from django.core.mail import send_mail
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


def send_company_registration_code_email(to_email: str, code: str, company_name: str) -> None:
    """One-time code to verify company contact email before creating the company profile."""
    to_email = (to_email or "").strip()
    if not to_email:
        return
    safe_name = _sanitize_subject_fragment(company_name or "Company", max_length=48)
    subject = f"{_BRAND} — verify company email ({safe_name})"
    message = (
        f"Hello,\n\n"
        f"You started registering a company profile ({safe_name}) on {_BRAND}.\n"
        f"Enter this verification code on the site to finish registration:\n\n"
        f"  {code}\n\n"
        f"If you did not start this registration, you can ignore this message.\n\n"
        f"— {_BRAND}\n"
        f"{_SITE}\n"
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
        logger.exception("Failed to send company registration code to %s", to_email)


def send_connection_request_email(connection_request):
    """Notify the recipient by email when another member sends a connection request."""
    target = connection_request.to_user
    actor = connection_request.from_user
    to_email = (getattr(target, "email", None) or "").strip()
    if not to_email:
        return

    actor_display = f"{actor.first_name} {actor.last_name}".strip() or actor.username

    subject = f"{_BRAND} — connection request from @{actor.username}"
    message = (
        f"Hello {target.first_name or target.username},\n\n"
        f"{actor_display} (@{actor.username}) sent you a connection request on {_BRAND}.\n\n"
        f"Sign in to open your notifications and accept or decline the request.\n"
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
        logger.exception("Failed to send connection request email to %s", to_email)


def send_vacancy_application_email(application):
    """
    Notify the vacancy owner (posted_by or company owner account) when someone applies.
    Never sends to company.public email — only the posting user's account email.
    """
    from apps.business.models import VacancyApplication

    if not isinstance(application, VacancyApplication):
        return

    vacancy = application.vacancy
    applicant = application.applicant

    owner = vacancy.posted_by
    if owner is None and vacancy.company_id:
        owner = vacancy.company.owner
    if owner is None:
        return

    to_email = (getattr(owner, "email", None) or "").strip()
    if not to_email:
        return

    vac_title = _sanitize_subject_fragment(vacancy.title or "Vacancy", max_length=56)
    applicant_display = (
        f"{applicant.first_name} {applicant.last_name}".strip() or applicant.username
    )
    applicant_email = (getattr(applicant, "email", None) or "").strip() or "(not provided)"
    motivation = (application.motivation_letter or "").strip()
    if len(motivation) > 1200:
        motivation = motivation[:1197].rstrip() + "..."

    vacancy_path = f"/vacancies/{vacancy.slug}/" if vacancy.slug else f"/vacancies/"
    link = f"{_SITE}{vacancy_path}"

    subject = f"{_BRAND} — new application for «{vac_title}»"
    message = (
        f"Hello {owner.first_name or owner.username},\n\n"
        f"Someone applied to your vacancy on {_BRAND}.\n\n"
        f"Vacancy\n"
        f"  {vacancy.title}\n"
        f"  {link}\n\n"
        f"Applicant\n"
        f"  Name: {applicant_display}\n"
        f"  Username: @{applicant.username}\n"
        f"  Email: {applicant_email}\n\n"
    )
    if motivation:
        message += f"Motivation (preview)\n{motivation}\n\n"
    message += (
        f"Sign in to review applications on {_BRAND}.\n"
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
        logger.exception("Failed to send vacancy application email to %s", to_email)


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
