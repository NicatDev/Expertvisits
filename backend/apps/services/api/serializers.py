from rest_framework import serializers
from apps.services.models import BookingRequest
from apps.accounts.models import User
from apps.accounts.api.serializers import UserSerializer

class BookingRequestSerializer(serializers.ModelSerializer):
    provider_name = serializers.StringRelatedField(source='provider', read_only=True)
    provider_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='provider', write_only=True
    )
    provider_details = UserSerializer(source='provider', read_only=True)
    customer_details = UserSerializer(source='customer', read_only=True)
    
    
    class Meta:
        model = BookingRequest
        fields = ['id', 'provider', 'provider_details', 'provider_name', 'provider_id', 'customer', 'customer_details', 'requested_datetime', 'duration_minutes', 'note', 'meet_link', 'location', 'status', 'timezone']
        extra_kwargs = {
            'customer': {'read_only': True},
            'provider': {'read_only': True},
        }
