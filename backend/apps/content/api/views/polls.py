from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Count
from apps.content.models import Poll, PollVote, PollOption
from apps.content.api.serializers import PollSerializer, PollCreateSerializer, PollVoteSerializer


def _poll_queryset():
    return (
        Poll.objects.select_related('author', 'sub_category')
        .prefetch_related('options', 'votes')
        .annotate(
            likes_count=Count('likes', distinct=True),
            comments_count=Count('comments', distinct=True),
        )
    )


class PollListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    queryset = _poll_queryset().order_by('-created_at')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PollCreateSerializer
        return PollSerializer

    def perform_create(self, serializer):
        serializer.save(
            author=self.request.user,
            sub_category=getattr(self.request.user, 'profession_sub_category', None),
        )


class PollRetrieveAPIView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    queryset = _poll_queryset()
    serializer_class = PollSerializer


class PollVoteAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        poll = get_object_or_404(_poll_queryset(), pk=pk)
        
        # Check if user already voted
        if PollVote.objects.filter(user=request.user, poll=poll).exists():
             return Response({"detail": "You have already voted on this poll."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = PollVoteSerializer(data=request.data)
        if serializer.is_valid():
            option = serializer.validated_data['option']
            
            # Ensure option belongs to poll
            if option.poll != poll:
                 return Response({"detail": "Invalid option for this poll."}, status=status.HTTP_400_BAD_REQUEST)

            PollVote.objects.create(user=request.user, poll=poll, option=option)

            # Köhnə `poll` üzərindəki prefetch cache səsverməni və user_vote-u saxlayır;
            # DB-dən təzə yüklə ki, faizlər və istifadəçi seçimi düzgün qayıtsın.
            poll = _poll_queryset().get(pk=poll.pk)
            poll_serializer = PollSerializer(poll, context={'request': request})
            return Response(poll_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
