from rest_framework import serializers
from apps.accounts.models import User, Category, SubCategory

class SubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SubCategory
        fields = ['id', 'name', 'slug', 'profession']

class CategorySerializer(serializers.ModelSerializer):
    subcategories = SubCategorySerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'subcategories']

class UserSerializer(serializers.ModelSerializer):
    profession_sub_category = SubCategorySerializer(read_only=True)
    profession_sub_category_id = serializers.PrimaryKeyRelatedField(
        queryset=SubCategory.objects.all(), source='profession_sub_category', write_only=True, allow_null=True, required=False
    )

    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    phone_number = serializers.CharField(required=False, allow_blank=True)
    interests = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=True, min_length=1
    )
    working_days = serializers.ListField(
        child=serializers.IntegerField(), required=False, allow_empty=True
    )

    followers_count = serializers.IntegerField(read_only=True)
    following_count = serializers.IntegerField(read_only=True)
    is_following = serializers.BooleanField(read_only=True, required=False)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'first_name', 'last_name', 
            'phone_number', 'birth_day', 'interests', 'avatar', 'cover_image',
            'profession_sub_category', 'profession_sub_category_id',
            'is_service_open', 'work_hours_start', 'work_hours_end', 'working_days',
            'followers_count', 'following_count', 'is_following'
        ]
        # read_only_fields = ['username', 'email'] # Username/Email handled by default logic? 
        # Wait, RegisterSerializer usually handles creation, so fields should be writable.
        extra_kwargs = {'password': {'write_only': True}}
    
    def create(self, validated_data):
        interests_ids = validated_data.pop('interests', [])
        password = validated_data.pop('password')
        
        # Set is_active to False initially
        validated_data['is_active'] = False
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        
        if interests_ids:
            user.interests.set(interests_ids)
        
        # Generate and Send Code
        import random
        from django.core.mail import send_mail
        from apps.accounts.models import VerificationCode
        
        code = str(random.randint(100000, 999999))
        VerificationCode.objects.create(user=user, code=code)
        
        try:
            send_mail(
                'Verify your account',
                f'Your verification code is: {code}',
                'noreply@expertvisits.com',
                [user.email],
                fail_silently=True,
            )
        except Exception as e:
            print(f"Error sending email: {e}")
            
        return user
