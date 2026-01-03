from rest_framework import viewsets, permissions, filters, status, views
from django.db.models import Count, Exists, OuterRef
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.accounts.models import User, Category, SubCategory, VerificationCode
from apps.accounts.api.serializers import UserSerializer, CategorySerializer

class VerifyEmailView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        
        if not email or not code:
            return Response({'error': 'Email and code are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check sessions first
        from apps.accounts.models import RegistrationSession
        
        session = RegistrationSession.objects.filter(email=email).first()
        if session:
            if session.code == code:
                # Create User
                user_data = session.user_data
                interests_ids = user_data.pop('interests', [])
                password = user_data.pop('password')
                
                # Check strict uniqueness again just in case
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
        
        # Fallback to old VerificationCode if user exists (legacy support or if logic mixes)
        # But per requirements "user yaratma", so we rely on session.
        # However, for previously created users, we might want to support them.
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

class UserViewSet(viewsets.ModelViewSet):
    # Annotate followers count for ordering
    def get_queryset(self):
        queryset = User.objects.annotate(
            followers_count=Count('followers', distinct=True),
            following_count=Count('following', distinct=True)
        )
        
        if self.request.user.is_authenticated:
            if self.action == 'list':
                queryset = queryset.exclude(id=self.request.user.id)
                
            queryset = queryset.annotate(
                is_following=Exists(
                    User.following.through.objects.filter(
                        from_user_id=self.request.user.id,
                        to_user_id=OuterRef('pk')
                    )
                )
            )
        return queryset

    # queryset = User.objects.all() # Overridden by get_queryset
    serializer_class = UserSerializer
    # permission_classes was global, but we need specific for create
    # permission_classes = [permissions.IsAuthenticatedOrReadOnly] 
    lookup_field = 'username'
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'first_name', 'last_name']
    ordering_fields = ['followers_count', 'date_joined']

    def get_permissions(self):
        if self.action in ['create', 'check_availability', 'resend_code']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticatedOrReadOnly()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Instead of saving user, save to RegistrationSession
        from apps.accounts.models import RegistrationSession
        import random
        from django.core.mail import send_mail
        
        validated_data = serializer.validated_data
        email = validated_data.get('email')
        
        # Generate code
        code = str(random.randint(100000, 999999))
        
        # Store data (needs to be serializable, interests are objects if not handled? 
        # Serializer validated_data might have objects if RelatedField used?
        # UserSerializer interests is ListField(child=IntegerField), so it should be list of ints.
        # But other fields? Date/Time? JSONField handles common types, but let's be safe.
        # Models objects -> need IDs.
        
        # UserSerializer define:
        # interests is write_only ListField(int). validated_data will have it as list of ints.
        # profession_sub_category is model instance if validation passed? No, PrimaryKeyRelatedField returns instance.
        # We need to serialize instance to ID for JSONField.
        
        user_data = dict(validated_data) # Copy
        
        if 'profession_sub_category' in user_data and user_data['profession_sub_category']:
             # It acts as Foreign Key related object
             user_data['profession_sub_category_id'] = user_data['profession_sub_category'].id
             del user_data['profession_sub_category']
        
        RegistrationSession.objects.update_or_create(
            email=email,
            defaults={
                'code': code,
                'user_data': user_data
            }
        )
        
        # Send Email
        try:
            send_mail(
                'Verify your account',
                f'Your verification code is: {code}',
                'expertvisits@gmail.com', 
                [email],
                fail_silently=False,
            )
        except Exception as e:
            return Response({'error': f'Failed to send email: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'message': 'Verification code sent', 'email': email}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def follow(self, request, username=None):
        target_user = self.get_object()
        if request.user == target_user:
            return Response({"error": "You cannot follow yourself"}, status=status.HTTP_400_BAD_REQUEST)
            
        request.user.following.add(target_user)
        return Response({"status": "followed"})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def unfollow(self, request, username=None):
        target_user = self.get_object()
        request.user.following.remove(target_user)
        return Response({"status": "unfollowed"})

    @action(detail=True, methods=['get'])
    def followers(self, request, username=None):
        target_user = self.get_object()
        # Use get_queryset to ensure annotations (is_following, counts) are present
        queryset = self.get_queryset().filter(following=target_user)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
             serializer = self.get_serializer(page, many=True)
             return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def following(self, request, username=None):
        target_user = self.get_object()
        # Use get_queryset to ensure annotations
        following_ids = target_user.following.values_list('id', flat=True)
        queryset = self.get_queryset().filter(id__in=following_ids)

        page = self.paginate_queryset(queryset)
        if page is not None:
             serializer = self.get_serializer(page, many=True)
             return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        # Retrieve user using get_queryset() to ensure annotations (like followers_count) are present
        instance = self.get_queryset().get(pk=request.user.pk)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def check_availability(self, request):
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

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def resend_code(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check RegistrationSession first
        from apps.accounts.models import RegistrationSession
        session = RegistrationSession.objects.filter(email=email).first()
        
        import random
        from django.core.mail import send_mail
        code = str(random.randint(100000, 999999))

        if session:
            session.code = code
            session.save()
            try:
                send_mail(
                    'Verify your account',
                    f'Your verification code is: {code}',
                    'expertvisits@gmail.com', 
                    [email],
                    fail_silently=False,
                )
                return Response({'message': 'Verification code resent successfully'}, status=status.HTTP_200_OK)
            except Exception as e:
                 return Response({'error': f'Failed to send email: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Legacy check
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            
        if user.is_active:
             return Response({'message': 'User already verified'}, status=status.HTTP_200_OK)
             
        VerificationCode.objects.create(user=user, code=code)
        
        try:
            send_mail(
                'Verify your account',
                f'Your verification code is: {code}',
                'expertvisits@gmail.com', 
                [user.email],
                fail_silently=False,
            )
        except Exception as e:
             return Response({'error': f'Failed to send email: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
             
        return Response({'message': 'Verification code resent successfully'}, status=status.HTTP_200_OK)

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

from apps.profiles.models import Experience, Education, Skill, Language, Certificate
from apps.profiles.api.serializers import (
    ExperienceSerializer, EducationSerializer, SkillSerializer,
    LanguageSerializer, CertificateSerializer
)

class UserProfileDetailsAPIView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        user_id = request.query_params.get('user_id')
        username = request.query_params.get('username')

        if not user_id and not username:
            return Response({'error': 'user_id or username required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if user_id:
                user = User.objects.get(id=user_id)
            else:
                user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        data = {
            'experience': ExperienceSerializer(Experience.objects.filter(user=user), many=True).data,
            'education': EducationSerializer(Education.objects.filter(user=user), many=True).data,
            'skills': SkillSerializer(Skill.objects.filter(user=user), many=True).data,
            'languages': LanguageSerializer(Language.objects.filter(user=user), many=True).data,
            'certificates': CertificateSerializer(Certificate.objects.filter(user=user), many=True).data,
        }
        return Response(data)
