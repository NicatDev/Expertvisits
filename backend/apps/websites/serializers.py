from rest_framework import serializers
from apps.accounts.models import User
from apps.websites.models import UserWebsite

class WebsiteUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'avatar']

class UserWebsiteSerializer(serializers.ModelSerializer):
    user = WebsiteUserSerializer(read_only=True)
    
    class Meta:
        model = UserWebsite
        fields = ['user', 'template_id']
