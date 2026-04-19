from rest_framework import generics, permissions, filters, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Prefetch, Q
from django.db import transaction
from django.http import Http404
from apps.accounts.models import User, RegistrationSession
from apps.accounts.api.serializers import (
    UserSerializer,
    RecommendedUserSerializer,
    ExpertListUserSerializer,
)
from apps.connections.models import ConnectionRequest
from apps.connections.services import disconnect_users, is_mutual_connection
from apps.connections.utils import with_connection_annotations
from apps.notifications.services import notify_connection_requested
from apps.business.api.views.companies import StandardResultsSetPagination
from apps.profiles.models import Education
import random
from core.utils.email import send_verification_email


def apply_expert_directory_filters(queryset, params):
    """Shared filters for user directory / experts search (query_params)."""
    hard_skills = params.getlist('hard_skills') or params.getlist('hard_skills[]')
    if hard_skills:
        for skill in hard_skills:
            queryset = queryset.filter(skills__name__icontains=skill, skills__skill_type='hard')

    soft_skills = params.getlist('soft_skills') or params.getlist('soft_skills[]')
    if soft_skills:
        for skill in soft_skills:
            queryset = queryset.filter(skills__name__icontains=skill, skills__skill_type='soft')

    locations = params.getlist('locations') or params.getlist('locations[]')
    if locations:
        location_q = Q()
        for loc in locations:
            if loc and str(loc).strip():
                location_q |= Q(city__icontains=str(loc).strip())
        queryset = queryset.filter(location_q)

    degree = params.get('degree')
    if degree:
        queryset = queryset.filter(educations__degree_type=degree)

    profession_sub_category_id = params.get('profession_sub_category_id')
    if profession_sub_category_id:
        queryset = queryset.filter(profession_sub_category_id=profession_sub_category_id)

    return queryset


class RecommendedUsersPagination(PageNumberPagination):
    page_size = 6
    page_size_query_param = 'page_size'
    max_page_size = 12


class UserRecommendedListAPIView(generics.ListAPIView):
    """Homepage recommended users: minimal fields, no following_count, connection state when authed."""

    serializer_class = RecommendedUserSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = RecommendedUsersPagination

    def get_queryset(self):
        qs = (
            User.objects.filter(is_searchable=True)
            .select_related('profession_sub_category')
            .annotate(followers_count=Count('followers', distinct=True))
            .order_by('-followers_count', '-date_joined')
        )
        user = self.request.user
        if user.is_authenticated:
            qs = qs.exclude(id=user.id)
            qs = with_connection_annotations(qs, user)
        return qs.distinct()


class UserExpertListAPIView(generics.ListAPIView):
    """Experts directory: card fields only, searchable users, filters + search; no connection annotations."""

    serializer_class = ExpertListUserSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'first_name', 'last_name']
    ordering_fields = ['followers_count', 'date_joined']
    ordering = ['-date_joined']

    def get_queryset(self):
        qs = (
            User.objects.filter(is_searchable=True)
            .select_related('profession_sub_category', 'website')
            .prefetch_related(
                Prefetch('educations', queryset=Education.objects.order_by('-start_date', '-id'))
            )
            .annotate(followers_count=Count('followers', distinct=True))
        )
        user = self.request.user
        if user.is_authenticated:
            qs = qs.exclude(id=user.id)
        qs = apply_expert_directory_filters(qs, self.request.query_params)
        return qs.distinct()


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
        queryset = User.objects.select_related('profession_sub_category', 'website').prefetch_related('company', 'educations', 'skills').annotate(
            followers_count=Count('followers', distinct=True),
            following_count=Count('following', distinct=True)
        ).order_by('-date_joined')

        if self.request.user.is_authenticated:
            queryset = queryset.exclude(id=self.request.user.id)
            queryset = with_connection_annotations(queryset, self.request.user)

        queryset = apply_expert_directory_filters(queryset, self.request.query_params)
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
            send_verification_email(email, code)
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
            queryset = with_connection_annotations(queryset, self.request.user)
        return queryset

    def get_object(self):
        """
        Case-insensitive + URL decode + NFC + camelCase→underscore variant (məs. DərgahAbdullayev / Dərgah_Abdullayev).
        """
        import unicodedata
        from urllib.parse import unquote

        queryset = self.filter_queryset(self.get_queryset())
        raw = self.kwargs.get(self.lookup_field) or ""
        s = unicodedata.normalize("NFC", unquote(str(raw)).strip())
        q = Q(username__iexact=s)
        if "_" not in s:
            for i in range(1, len(s)):
                ch = s[i]
                if "A" <= ch <= "Z":
                    q |= Q(username__iexact=s[:i] + "_" + s[i:])
                    break
        obj = queryset.filter(q).first()
        if obj is None:
            raise Http404()
        self.check_object_permissions(self.request, obj)
        return obj

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
        queryset = with_connection_annotations(queryset, self.request.user)
        return queryset.get(pk=self.request.user.pk)

class FollowAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, username=None):
        try:
            target_user = User.objects.get(username=username)
        except User.DoesNotExist:
             return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if request.user == target_user:
            return Response({"error": "You cannot connect to yourself"}, status=status.HTTP_400_BAD_REQUEST)

        if is_mutual_connection(request.user, target_user):
            return Response({"status": "connected"})

        if ConnectionRequest.objects.filter(
            from_user=request.user,
            to_user=target_user,
            status=ConnectionRequest.Status.PENDING,
        ).exists():
            return Response({"status": "pending"})

        if ConnectionRequest.objects.filter(
            from_user=target_user,
            to_user=request.user,
            status=ConnectionRequest.Status.PENDING,
        ).exists():
            return Response(
                {"status": "incoming_pending", "detail": "This user already sent you a connection request."},
                status=status.HTTP_409_CONFLICT,
            )

        with transaction.atomic():
            existing = (
                ConnectionRequest.objects.select_for_update()
                .filter(
                    from_user=request.user,
                    to_user=target_user,
                    status=ConnectionRequest.Status.PENDING,
                )
                .order_by("-id")
                .first()
            )
            cr = existing or ConnectionRequest.objects.create(from_user=request.user, to_user=target_user)
        notify_connection_requested(cr)
        return Response({"status": "pending", "request_id": cr.id})

class UnfollowAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, username=None):
        try:
            target_user = User.objects.get(username=username)
        except User.DoesNotExist:
             return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        disconnect_users(request.user, target_user)
        return Response({"status": "disconnected"})

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
        if self.request.user.is_authenticated:
            queryset = with_connection_annotations(queryset, self.request.user)
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
            queryset = with_connection_annotations(queryset, self.request.user)
        return queryset
