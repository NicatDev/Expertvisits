from rest_framework import generics, permissions, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Exists, OuterRef
from apps.accounts.models import User, RegistrationSession
from apps.accounts.api.serializers import UserSerializer
from apps.business.api.views.companies import StandardResultsSetPagination
import random
from django.core.mail import send_mail

class UserListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = UserSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'first_name', 'last_name']
    ordering_fields = ['followers_count', 'date_joined']
    permission_classes = [permissions.IsAuthenticatedOrReadOnly] # Except for create logic below which overrides

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticatedOrReadOnly()]

    def get_queryset(self):
        queryset = User.objects.select_related('profession_sub_category').prefetch_related('company', 'educations', 'skills').annotate(
            followers_count=Count('followers', distinct=True),
            following_count=Count('following', distinct=True)
        ).order_by('-date_joined')
        
        # Standard search handling via filter_backends


        if self.request.user.is_authenticated:
            queryset = queryset.exclude(id=self.request.user.id)
            queryset = queryset.annotate(
                is_following=Exists(
                    User.following.through.objects.filter(
                        from_user_id=self.request.user.id,
                        to_user_id=OuterRef('pk')
                    )
                )
            )

        # Custom Filters
        from django.db.models import Q
        params = self.request.query_params

        # Skills (Strict AND logic - user must have ALL selected skills)
        # Support both 'key' and 'key[]' formats
        hard_skills = params.getlist('hard_skills') or params.getlist('hard_skills[]')
        if hard_skills:
            for skill in hard_skills:
                queryset = queryset.filter(skills__name__icontains=skill, skills__skill_type='hard')

        soft_skills = params.getlist('soft_skills') or params.getlist('soft_skills[]')
        if soft_skills:
            for skill in soft_skills:
                queryset = queryset.filter(skills__name__icontains=skill, skills__skill_type='soft')

        # Locations (OR logic - user can be in any of the selected cities)
        locations = params.getlist('locations') or params.getlist('locations[]')
        if locations:
            location_q = Q()
            for loc in locations:
                location_q |= Q(city__icontains=loc)
            queryset = queryset.filter(location_q)

        # Degree (Simple filter)
        degree = params.get('degree')
        if degree:
            queryset = queryset.filter(educations__degree_type=degree).distinct()

        return queryset.distinct()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        validated_data = serializer.validated_data
        email = validated_data.get('email')
        code = str(random.randint(100000, 999999))
        
        user_data = dict(validated_data) 
        if 'profession_sub_category' in user_data and user_data['profession_sub_category']:
             user_data['profession_sub_category_id'] = user_data['profession_sub_category'].id
             del user_data['profession_sub_category']
        elif 'profession_sub_category_id' in user_data and user_data['profession_sub_category_id']:
             # Already has ID, just ensure it's not None
             pass

        if 'birth_day' in user_data and user_data['birth_day']:
            user_data['birth_day'] = str(user_data['birth_day'])

        RegistrationSession.objects.update_or_create(
            email=email,
            defaults={
                'code': code,
                'user_data': user_data
            }
        )
        
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


class UserDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    # queryset explicitly not defining here because dependent on auth status annotation
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'username'

    def get_queryset(self):
        # Same annotation logic
        queryset = User.objects.select_related('profession_sub_category').prefetch_related('company').annotate(
            followers_count=Count('followers', distinct=True),
            following_count=Count('following', distinct=True)
        )
        if self.request.user.is_authenticated:
            queryset = queryset.annotate(
                is_following=Exists(
                    User.following.through.objects.filter(
                        from_user_id=self.request.user.id,
                        to_user_id=OuterRef('pk')
                    )
                )
            )
        return queryset

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        new_username = request.data.get('username')
        new_email = request.data.get('email')

        errors = {}
        if new_username and new_username != instance.username:
            if User.objects.filter(username=new_username).exclude(pk=instance.pk).exists():
                errors['username'] = ["Bu istifadəçi adı artıq mövcuddur."]
        
        if new_email and new_email != instance.email:
            if User.objects.filter(email=new_email).exclude(pk=instance.pk).exists():
                errors['email'] = ["Bu e-poçt ünvanı artıq istifadədədir."]

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)

class UserMeAPIView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        # Apply annotations manually or call helper if we had one
        queryset = User.objects.select_related('profession_sub_category').prefetch_related('company').annotate(
            followers_count=Count('followers', distinct=True),
            following_count=Count('following', distinct=True)
        )
        return queryset.get(pk=self.request.user.pk)

class FollowAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, username=None):
        try:
            target_user = User.objects.get(username=username)
        except User.DoesNotExist:
             return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if request.user == target_user:
            return Response({"error": "You cannot follow yourself"}, status=status.HTTP_400_BAD_REQUEST)
            
        request.user.following.add(target_user)
        return Response({"status": "followed"})

class UnfollowAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, username=None):
        try:
            target_user = User.objects.get(username=username)
        except User.DoesNotExist:
             return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        request.user.following.remove(target_user)
        return Response({"status": "unfollowed"})

class UserFollowersAPIView(generics.ListAPIView):
     serializer_class = UserSerializer
     permission_classes = [permissions.IsAuthenticatedOrReadOnly]
     
     def get_queryset(self):
        username = self.kwargs['username']
        try:
            target_user = User.objects.get(username=username)
        except User.DoesNotExist:
             return User.objects.none()

        queryset = User.objects.filter(following=target_user).annotate(
            followers_count=Count('followers', distinct=True),
            following_count=Count('following', distinct=True)
        )
        # Add is_following context
        if self.request.user.is_authenticated:
            queryset = queryset.annotate(
                is_following=Exists(
                    User.following.through.objects.filter(
                        from_user_id=self.request.user.id,
                        to_user_id=OuterRef('pk')
                    )
                )
            )
        return queryset

class UserFollowingAPIView(generics.ListAPIView):
     serializer_class = UserSerializer
     permission_classes = [permissions.IsAuthenticatedOrReadOnly]
     
     def get_queryset(self):
        username = self.kwargs['username']
        try:
            target_user = User.objects.get(username=username)
        except User.DoesNotExist:
             return User.objects.none()

        following_ids = target_user.following.values_list('id', flat=True)
        queryset = User.objects.filter(id__in=following_ids).annotate(
            followers_count=Count('followers', distinct=True),
            following_count=Count('following', distinct=True)
        )
        if self.request.user.is_authenticated:
            queryset = queryset.annotate(
                is_following=Exists(
                    User.following.through.objects.filter(
                        from_user_id=self.request.user.id,
                        to_user_id=OuterRef('pk')
                    )
                )
            )
        return queryset
