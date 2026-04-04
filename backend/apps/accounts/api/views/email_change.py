import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import EmailChangeRequest
from core.utils.email import send_email_change_verification_email

User = get_user_model()
EMAIL_CHANGE_TTL = timedelta(minutes=30)


class RequestEmailChangeAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        new_email = (request.data.get('new_email') or '').strip()
        if not new_email:
            return Response({'detail': 'new_email_required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_email(new_email)
        except DjangoValidationError:
            return Response({'detail': 'invalid_email'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        normalized = new_email.lower()
        if user.email.lower() == normalized:
            return Response({'detail': 'email_same_as_current'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email__iexact=normalized).exclude(pk=user.pk).exists():
            return Response({'detail': 'email_already_in_use'}, status=status.HTTP_400_BAD_REQUEST)

        code = str(random.randint(100000, 999999))
        EmailChangeRequest.objects.update_or_create(
            user=user,
            defaults={
                'new_email': new_email,
                'code': code,
                'expires_at': timezone.now() + EMAIL_CHANGE_TTL,
            },
        )

        try:
            send_email_change_verification_email(new_email, code)
        except Exception:
            return Response({'detail': 'email_send_failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'detail': 'verification_sent'}, status=status.HTTP_200_OK)


class ConfirmEmailChangeAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        new_email = (request.data.get('new_email') or '').strip()
        code = (request.data.get('code') or '').strip()
        if not new_email or not code:
            return Response({'detail': 'new_email_and_code_required'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        try:
            pending = EmailChangeRequest.objects.get(user=user)
        except EmailChangeRequest.DoesNotExist:
            return Response({'detail': 'no_pending_change'}, status=status.HTTP_400_BAD_REQUEST)

        if timezone.now() > pending.expires_at:
            pending.delete()
            return Response({'detail': 'code_expired'}, status=status.HTTP_400_BAD_REQUEST)

        if pending.new_email.lower() != new_email.lower():
            return Response({'detail': 'email_mismatch'}, status=status.HTTP_400_BAD_REQUEST)

        if pending.code != code:
            return Response({'detail': 'invalid_code'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email__iexact=pending.new_email.lower()).exclude(pk=user.pk).exists():
            pending.delete()
            return Response({'detail': 'email_already_in_use'}, status=status.HTTP_400_BAD_REQUEST)

        user.email = pending.new_email.lower()
        user.save(update_fields=['email'])
        pending.delete()
        return Response({'detail': 'email_updated'}, status=status.HTTP_200_OK)
