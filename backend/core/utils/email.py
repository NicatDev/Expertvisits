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


def send_password_reset_email(email, code):
    """
    One-time code to reset an account password.
    """
    subject = f"{_BRAND} â€” reset your password"
    message = (
        f"Hello,\n\n"
        f"You asked to reset the password for your {_BRAND} account. "
        f"Enter this one-time code on the site to continue:\n\n"
        f"  {code}\n\n"
        f"If you did not request a password reset, you can ignore this email.\n\n"
        f"â€” {_BRAND}\n"
        f"{_SITE}\n"
    )
    return send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False,
    )


def send_registration_complete_email(email, username, locale='az', include_password_link=False):
    """
    Welcome email after manual or Google signup. Does not send passwords.
    """
    safe_locale = locale if locale in {'az', 'en', 'ru'} else 'az'
    base_url = f"https://expertvisits.com/{safe_locale}"
    reset_url = f"{base_url}/forgot-password"
    website_url = f"{base_url}/website-template"

    copy = {
        'az': {
            'subject': f"{_BRAND} â€” qeydiyyat tamamlandı",
            'hello': "Salam,",
            'done': f"Qeydiyyatı uğurla tamamladınız.",
            'username': "Username",
            'password_link': (
                "Google ilə qeydiyyatdan keçdiyiniz üçün lokal şifrə hələ təyin olunmayıb. "
                "Şifrə təyin etmək istəyirsinizsə, bu keçiddən istifadə edin:"
            ),
            'website': (
                "Expert Visits-də öz vebsaytınızı da yarada bilərsiniz. "
                "Profil məlumatlarınızı doldurub ödənişsiz portfolio vebsaytınızı burada yarada bilərsiniz:"
            ),
        },
        'en': {
            'subject': f"{_BRAND} â€” registration completed",
            'hello': "Hello,",
            'done': "Your registration has been completed successfully.",
            'username': "Username",
            'password_link': (
                "Because you registered with Google, you do not have a local password yet. "
                "If you want to set one, use this link:"
            ),
            'website': (
                "You can also create your own website on Expert Visits. "
                "Complete your profile information and create your free portfolio website here:"
            ),
        },
        'ru': {
            'subject': f"{_BRAND} â€” регистрация завершена",
            'hello': "Здравствуйте,",
            'done': "Вы успешно завершили регистрацию.",
            'username': "Username",
            'password_link': (
                "Так как вы зарегистрировались через Google, локальный пароль пока не задан. "
                "Если хотите задать пароль, используйте эту ссылку:"
            ),
            'website': (
                "В Expert Visits вы также можете создать свой сайт. "
                "Заполните данные профиля и создайте бесплатный сайт-портфолио здесь:"
            ),
        },
    }[safe_locale]

    subject = copy['subject']
    password_line = f"\n{copy['password_link']}\n{reset_url}\n" if include_password_link else ""

    message = (
        f"{copy['hello']}\n\n"
        f"{copy['done']}\n\n"
        f"{copy['username']}: {username}\n"
        f"{password_line}\n"
        f"{copy['website']}\n"
        f"{website_url}\n\n"
        f"â€” {_BRAND}\n"
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


def send_vacancy_application_status_email(application_id):
    from apps.business.models import VacancyApplication

    try:
        application = VacancyApplication.objects.select_related(
            "vacancy", "vacancy__company", "applicant"
        ).get(pk=application_id)
    except VacancyApplication.DoesNotExist:
        return

    applicant = application.applicant
    to_email = (getattr(applicant, "email", None) or "").strip()
    if not to_email:
        return

    vacancy = application.vacancy
    status_labels = {
        "accepted": "müsbətdir",
        "rejected": "mənfidir",
    }
    status_label = status_labels.get(application.status, application.status)
    reason = (application.response_message or "").strip()
    vacancy_path = f"/vacancies/{vacancy.slug}/" if vacancy.slug else "/vacancies/"
    link = f"{_SITE}{vacancy_path}"
    subject = f"{_BRAND} — vakansiya müraciətinizə cavab"
    message = (
        f"Salam {applicant.first_name or applicant.username},\n\n"
        f"Vakansiya müraciətinizə cavab {status_label}.\n\n"
        f"Vakansiya:\n"
        f"  {vacancy.title}\n"
        f"  {link}\n\n"
        f"Cavab:\n"
        f"  {'Müsbət' if application.status == 'accepted' else 'Mənfi'}\n\n"
    )
    if reason:
        message += f"Səbəb / mesaj:\n{reason}\n\n"
    message += f"— {_BRAND}\n"

    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [to_email],
            fail_silently=False,
        )
    except Exception:
        logger.exception("Failed to send vacancy application status email to %s", to_email)


def send_company_site_contact_email(company_email, sender_name, sender_email, subject_line, body_text):
    """
    Contact form submission from a public company website → company inbox (owner contact email).
    """
    safe_subj = _sanitize_subject_fragment(subject_line)
    subject = f"{_BRAND} company site — {safe_subj}"
    message = (
        f"You received a message through your {_BRAND} company website.\n\n"
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
        [company_email],
        fail_silently=False,
    )


def send_company_site_contact_confirmation_email(sender_email, company_name, subject_line):
    """Notify the visitor that their message was delivered to the company inbox."""
    safe_subj = _sanitize_subject_fragment(subject_line)
    safe_company = _sanitize_subject_fragment(company_name or "Company", max_length=120)
    subject = f"{_BRAND} — we sent your message to {safe_company}"
    message = (
        f"Hello,\n\n"
        f"We have forwarded your message (subject: {safe_subj}) to {safe_company}.\n"
        f"They may reply to you directly at the email address you provided.\n\n"
        f"If you did not use the contact form on {_SITE}, you can ignore this email.\n\n"
        f"— {_BRAND}\n"
        f"{_SITE}\n"
    )
    return send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [sender_email],
        fail_silently=False,
    )


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
