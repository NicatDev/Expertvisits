from rest_framework import serializers
from apps.accounts.models import User, Category, SubCategory

class SubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SubCategory
        fields = [
            'id',
            'slug',
            'external_id',
            'name_az',
            'name_en',
            'name_ru',
            'profession_az',
            'profession_en',
            'profession_ru',
        ]

class CategorySerializer(serializers.ModelSerializer):
    subcategories = SubCategorySerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'slug', 'external_id', 'subcategories', 'name_az', 'name_en', 'name_ru']

class UserSerializer(serializers.ModelSerializer):
    profession_sub_category = SubCategorySerializer(read_only=True)
    profession_sub_category_id = serializers.PrimaryKeyRelatedField(
        queryset=SubCategory.objects.all(), source='profession_sub_category', write_only=True, allow_null=True, required=False
    )

    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    phone_number = serializers.CharField(required=False, allow_blank=True) # Assuming no extra validation here for mock
    summary = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    interests = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False, allow_empty=True
    )
    working_days = serializers.ListField(
        child=serializers.IntegerField(), required=False, allow_empty=True
    )

    followers_count = serializers.IntegerField(read_only=True)
    following_count = serializers.IntegerField(read_only=True)
    is_following = serializers.SerializerMethodField()
    connection_pending_out = serializers.SerializerMethodField()
    connection_pending_in = serializers.SerializerMethodField()
    outgoing_connection_request_id = serializers.SerializerMethodField()
    company_slug = serializers.SerializerMethodField()
    highest_education = serializers.SerializerMethodField()
    website_active = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'first_name', 'last_name', 
            'phone_number', 'birth_day', 'city', 'summary', 'language', 'interests', 'avatar', 'avatar_compressed', 'cover_image',
            'profession_sub_category', 'profession_sub_category_id',
            'is_service_open', 'work_hours_start', 'work_hours_end', 'working_days',
            'followers_count', 'following_count', 'is_following',
            'connection_pending_out', 'connection_pending_in', 'outgoing_connection_request_id', 'company_slug',
            'highest_education',
            'open_to',
            'is_searchable', 'show_phone_number', 'notify_email_general',
            'notify_meeting_reminder_1h', 'notify_meeting_reminder_15m',
            'notify_new_follower', 'notify_updates',
            'website_active'
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
        from core.utils.email import send_verification_email
        from apps.accounts.models import VerificationCode
        
        code = str(random.randint(100000, 999999))
        VerificationCode.objects.create(user=user, code=code)
        
        try:
            send_verification_email(user.email, code)
        except Exception as e:
            print(f"Error sending email: {e}")
            
        return user
    def get_is_following(self, obj):
        """Mutual connection (both users follow each other)."""
        i = getattr(obj, "conn_i_follow", None)
        f = getattr(obj, "conn_follows_me", None)
        if i is None and f is None:
            return False
        return bool(i and f)

    def get_connection_pending_out(self, obj):
        return bool(getattr(obj, "conn_pending_out", False))

    def get_connection_pending_in(self, obj):
        return bool(getattr(obj, "conn_pending_in", False))

    def get_outgoing_connection_request_id(self, obj):
        v = getattr(obj, "conn_pending_out_id", None)
        return int(v) if v is not None else None

    def get_company_slug(self, obj):
        try:
            return obj.company.slug
        except:
            return None

    def get_highest_education(self, obj):
        educations = obj.educations.all()
        if not educations:
            return None
        
        # Rank degrees
        ranks = {
            'doctorate': 6,
            'master': 5,
            'bachelor': 4,
            'full_secondary': 3,
            'secondary': 2,
            'vocational': 1,
            'certification': 0
        }
        
        highest = None
        max_rank = -1
        
        for edu in educations:
            rank = ranks.get(edu.degree_type, -1)
            if rank > max_rank:
                max_rank = rank
                highest = edu
        
        if highest:
            # Need to get display value manually or from choice list if possible. 
            # Easiest is to return the object details or just the type/display.
            # Returning display string.
            return highest.get_degree_type_display()
        return None

    def get_website_active(self, obj):
        if not getattr(obj, 'is_active', True):
            return False
        try:
            w = obj.website
        except Exception:
            return False
        if getattr(w, 'is_deleted', False):
            return False
        if not w.is_active:
            return False
        tid = getattr(w, 'template_id', None)
        if tid is None or int(tid) <= 0:
            return False
        return True

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        
        # Hide phone number if show_phone_number is False and requester is not the owner
        if not instance.show_phone_number:
            if request and request.user != instance:
                ret.pop('phone_number', None)
            elif not request: # Case where request is missing? Assume hide? Or internal?
                # Usually keep if internal
                pass
        
        return ret
