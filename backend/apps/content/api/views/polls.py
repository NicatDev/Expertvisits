from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from apps.content.models import Poll, PollVote, PollOption
from apps.content.api.serializers import PollSerializer, PollCreateSerializer, PollVoteSerializer

class PollListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    queryset = Poll.objects.all().order_by('-created_at')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PollCreateSerializer
        return PollSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class PollVoteAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        poll = get_object_or_404(Poll, pk=pk)
        
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
            
            # Return updated poll data
            poll_serializer = PollSerializer(poll, context={'request': request})
            return Response(poll_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
