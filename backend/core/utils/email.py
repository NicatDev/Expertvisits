from django.core.mail import send_mail
from django.conf import settings

def send_verification_email(email, code, language='az'):
    """
    Sends a formatted verification email based on the user's language.
    """
    if language == 'ru':
        subject = 'Expert Visits | Подтверждение аккаунта'
        message = (
            f"Здравствуйте!\n\n"
            f"Благодарим вас за регистрацию на платформе Expert Visits!\n\n"
            f"Для подтверждения вашего аккаунта используйте следующий код:\n"
            f"{code}\n\n"
            f"Не передавайте этот код третьим лицам.\n\n"
            f"С уважением,\n"
            f"Команда Expert Visits"
        )
    elif language == 'en':
        subject = 'Expert Visits | Account Verification'
        message = (
            f"Hello,\n\n"
            f"Thank you for registering on the Expert Visits platform!\n\n"
            f"Please use the following code to verify your account:\n"
            f"{code}\n\n"
            f"Do not share this code with anyone.\n\n"
            f"Best regards,\n"
            f"Expert Visits Team"
        )
    else: # default 'az'
        subject = 'Expert Visits | Hesabın təsdiqlənməsi'
        message = (
            f"Salam,\n\n"
            f"Expert Visits platformasında qeydiyyatdan keçdiyiniz üçün təşəkkür edirik!\n\n"
            f"Hesabınızı təsdiqləmək üçün aşağıdakı kodu istifadə edin:\n"
            f"{code}\n\n"
            f"Bu kodu heç kimlə paylaşmayın.\n\n"
            f"Hörmətlə,\n"
            f"Expert Visits Komandası"
        )

    return send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False,
    )
