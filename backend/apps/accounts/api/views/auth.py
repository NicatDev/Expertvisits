from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from apps.accounts.models import User, VerificationCode, RegistrationSession
import random

class VerifyEmailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        
        if not email or not code:
            return Response({'error': 'Email and code are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        session = RegistrationSession.objects.filter(email=email).first()
        if session:
            if session.code == code:
                user_data = session.user_data
                interests_ids = user_data.pop('interests', [])
                password = user_data.pop('password')
                
                if User.objects.filter(username=user_data['username']).exists():
                     return Response({'error': 'Username taken during verification'}, status=status.HTTP_400_BAD_REQUEST)

                user_data['is_active'] = True
                user = User(**user_data)
                user.set_password(password)
                user.save()
                
                if interests_ids:
                    user.interests.set(interests_ids)
                
                session.delete()
                
                return Response({'message': 'Account verified and created successfully'}, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Invalid code'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Legacy support
        try:
            user = User.objects.get(email=email)
            if user.is_active:
                 return Response({'message': 'User already verified'}, status=status.HTTP_200_OK)
            verification = VerificationCode.objects.filter(user=user, is_used=False).order_by('-created_at').first()
            if verification and verification.code == code:
                user.is_active = True
                user.save()
                verification.is_used = True
                verification.save()
                return Response({'message': 'Account verified successfully'}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            pass

        return Response({'error': 'Invalid verification session'}, status=status.HTTP_400_BAD_REQUEST)

class CheckAvailabilityAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        
        errors = {}
        if username and User.objects.filter(username=username).exists():
            errors['username'] = ['This username is already taken.']
        
        if email and User.objects.filter(email=email).exists():
            errors['email'] = ['This email is already registered.']
            
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
            
        return Response({'message': 'Available'}, status=status.HTTP_200_OK)

class ResendCodeAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        session = RegistrationSession.objects.filter(email=email).first()
        code = str(random.randint(100000, 999999))

        if session:
            session.code = code
            session.save()
            try:
                from core.utils.email import send_verification_email
                send_verification_email(email, code)
                return Response({'message': 'Verification code resent successfully'}, status=status.HTTP_200_OK)
            except Exception as e:
                 return Response({'error': f'Failed to send email: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            
        if user.is_active:
             return Response({'message': 'User already verified'}, status=status.HTTP_200_OK)
             
        VerificationCode.objects.create(user=user, code=code)
        
        try:
            from core.utils.email import send_verification_email
            send_verification_email(user.email, code)
        except Exception as e:
             return Response({'error': f'Failed to send email: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
             
        return Response({'message': 'Verification code resent successfully'}, status=status.HTTP_200_OK)

class SetPasswordAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        new_password = request.data.get('new_password')
        current_password = request.data.get('current_password')
        
        if not new_password or not current_password:
             return Response({'error': 'Current and new password are required'}, status=status.HTTP_400_BAD_REQUEST)
             
        if not user.check_password(current_password):
             return Response({'error': 'Invalid current password'}, status=status.HTTP_400_BAD_REQUEST)
             
        user.set_password(new_password)
        user.save()
        
        return Response({'message': 'Password updated successfully'}, status=status.HTTP_200_OK)
