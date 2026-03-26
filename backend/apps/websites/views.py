from rest_framework import generics, filters
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Count

from apps.websites.models import UserWebsite
from .serializers import UserWebsiteSerializer, ArticlePublicSerializer
from apps.content.models import Article


class UserWebsitePublicDetailView(generics.RetrieveAPIView):
    queryset = UserWebsite.objects.select_related('user').prefetch_related(
        'user__experiences',
        'user__educations',
        'user__skills',
        'user__languages',
        'user__certificates'
    ).filter(is_active=True, is_deleted=False)
    serializer_class = UserWebsiteSerializer
    permission_classes = [AllowAny]
    lookup_field = 'user__username'
    lookup_url_kwarg = 'username'


class WebsiteArticlePagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


class UserArticlesPublicListView(generics.ListAPIView):
    """
    Public API to list articles for a user's portfolio website.
    Requires the user to have an active UserWebsite record.
    Supports search (?search=) and pagination (?page=&page_size=).
    """
    serializer_class = ArticlePublicSerializer
    permission_classes = [AllowAny]
    pagination_class = WebsiteArticlePagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'body']
    ordering_fields = ['created_at', 'title']
    ordering = ['-created_at']

    def get_queryset(self):
        username = self.kwargs['username']
        # Validate that this user has an active website, otherwise 404
        website = get_object_or_404(
            UserWebsite.objects.select_related('user'),
            user__username=username,
            is_active=True,
            is_deleted=False
        )
        return Article.objects.filter(
            author=website.user
        ).select_related('author').order_by('-created_at')


class UserArticlePublicDetailView(generics.RetrieveAPIView):
    """
    Public API to retrieve a single article for a user's portfolio.
    Requires username and article slug.
    """
    serializer_class = ArticlePublicSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'
    lookup_url_kwarg = 'slug'

    def get_queryset(self):
        username = self.kwargs['username']
        website = get_object_or_404(
            UserWebsite.objects.select_related('user'),
            user__username=username,
            is_active=True,
            is_deleted=False
        )
        return Article.objects.filter(author=website.user).select_related('author')


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from django.conf import settings

class UserWebsiteContactAPIView(APIView):
    """
    Public API to send a contact message to a portfolio owner.
    """
    permission_classes = [AllowAny]

    def post(self, request, username):

        name = request.data.get('name')
        email = request.data.get('email')
        subject = request.data.get('subject')
        message = request.data.get('message')

        if not all([name, email, subject, message]):
            return Response(
                {"detail": "Name, email, subject, and message are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Build email content
        email_subject = f"New Contact Message via Portfolio: {subject}"
        email_body = f"You have received a new message from your portfolio website.\n\n" \
                     f"Name: {name}\nEmail: {email}\n\n" \
                     f"Message:\n{message}"

        try:
            send_mail(
                subject=email_subject,
                message=email_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            return Response({"detail": "Message sent successfully."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"detail": "Failed to send email. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

from rest_framework.permissions import IsAuthenticated

class UserWebsiteManageAPIView(APIView):
    """
    API for authenticated user to manage their own portfolio website.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            website = UserWebsite.objects.get(user=request.user)
            return Response({"template_id": website.template_id, "is_active": website.is_active}, status=status.HTTP_200_OK)
        except UserWebsite.DoesNotExist:
            return Response({"template_id": None, "is_active": False}, status=status.HTTP_200_OK)

    def post(self, request):
        template_id = request.data.get('template_id')
        if not template_id:
            return Response({"detail": "template_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        website, created = UserWebsite.objects.update_or_create(
            user=request.user,
            defaults={
                'template_id': template_id,
                'is_active': True,
                'is_deleted': False
            }
        )

        return Response({"detail": "Portfolio website saved successfully."}, status=status.HTTP_200_OK)

    def delete(self, request):
        try:
            website = UserWebsite.objects.get(user=request.user)
            website.is_active = False
            website.is_deleted = True
            website.save()
            return Response({"detail": "Portfolio website deactivated successfully."}, status=status.HTTP_200_OK)
        except UserWebsite.DoesNotExist:
            return Response({"detail": "Website not found"}, status=status.HTTP_404_NOT_FOUND)
