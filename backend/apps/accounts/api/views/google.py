from rest_framework.views import APIView
import os
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests
import uuid
from django.core.files.base import ContentFile
import requests as http_requests

User = get_user_model()

from rest_framework.permissions import AllowAny

class GoogleAuthView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)

        user_data = None
        
        # Try as ID Token first
        try:
            id_info = id_token.verify_oauth2_token(
                token, requests.Request(), os.getenv('GOOGLE_OAUTH2_CLIENT_ID')
            )
            user_data = {
                'email': id_info['email'],
                'first_name': id_info.get('given_name', ''),
                'last_name': id_info.get('family_name', ''),
                'picture': id_info.get('picture')
            }
        except Exception:
            # Try as Access Token
            try:
                response = http_requests.get(
                    f'https://www.googleapis.com/oauth2/v3/userinfo?access_token={token}'
                )
                if response.status_code == 200:
                    info = response.json()
                    user_data = {
                        'email': info['email'],
                        'first_name': info.get('given_name', ''),
                        'last_name': info.get('family_name', ''),
                        'picture': info.get('picture')
                    }
            except Exception:
                pass

        if not user_data:
             return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)

        email = user_data['email']
        first_name = user_data['first_name']
        last_name = user_data['last_name']
        picture_url = user_data['picture']

        try:
            # Check if user exists
            user, created = User.objects.get_or_create(email=email, defaults={
                'first_name': first_name,
                'last_name': last_name,
                'is_active': True,
                'username': email.split('@')[0] + '_' + str(uuid.uuid4())[:8] # Unique username
            })

            if created:
                user.set_unusable_password()
                user.save()
                
                # Try to save profile picture
                if picture_url:
                    try:
                        response = http_requests.get(picture_url)
                        if response.status_code == 200:
                            user.avatar.save(f"{user.username}_avatar.jpg", ContentFile(response.content), save=True)
                    except Exception as e:
                        pass # Ignore image saving errors

            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'avatar': user.avatar.url if user.avatar else None,
                }
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
