from django.urls import path, include
from apps.content.api.views import (
    ArticleListCreateAPIView, ArticleDetailAPIView,
    QuizListCreateAPIView, QuizDetailAPIView, QuizSubmitAPIView,
    QuizResultAPIView, QuizParticipantsAPIView, QuizParticipantDetailAPIView,
    QuizMyAttemptsAPIView,
    FeedAPIView, UserFeedAPIView, PublicFeedAPIView, ArticleStatsAPIView,
    CollectionListCreateAPIView, CollectionDetailAPIView, CollectionContentOptionsAPIView,
)
from apps.content.api.views.polls import PollListCreateAPIView, PollRetrieveAPIView, PollVoteAPIView

urlpatterns = [
    # Articles
    path('articles/', ArticleListCreateAPIView.as_view(), name='article-list'),
    path('articles/<slug:slug>/', ArticleDetailAPIView.as_view(), name='article-detail'),

    # Quizzes (lookup by slug)
    path('quizzes/', QuizListCreateAPIView.as_view(), name='quiz-list'),
    path('quizzes/<slug:slug>/', QuizDetailAPIView.as_view(), name='quiz-detail'),
    path('quizzes/<slug:slug>/submit/', QuizSubmitAPIView.as_view(), name='quiz-submit'),
    path('quizzes/<slug:slug>/result/', QuizResultAPIView.as_view(), name='quiz-result'),
    path('quizzes/<slug:slug>/my-attempts/', QuizMyAttemptsAPIView.as_view(), name='quiz-my-attempts'),
    path('quizzes/<slug:slug>/participants/', QuizParticipantsAPIView.as_view(), name='quiz-participants'),
    path('quizzes/<slug:slug>/participants/<int:user_id>/', QuizParticipantDetailAPIView.as_view(), name='quiz-participant-detail'),

    # Polls
    path('polls/', PollListCreateAPIView.as_view(), name='poll-list'),
    path('polls/<int:pk>/vote/', PollVoteAPIView.as_view(), name='poll-vote'),
    path('polls/<int:pk>/', PollRetrieveAPIView.as_view(), name='poll-detail'),

    # Collections
    path('collections/', CollectionListCreateAPIView.as_view(), name='collection-list'),
    path('collections/content-options/', CollectionContentOptionsAPIView.as_view(), name='collection-content-options'),
    path('collections/<slug:slug>/', CollectionDetailAPIView.as_view(), name='collection-detail'),



    # Feeds & Stats
    path('feed/', FeedAPIView.as_view(), name='feed'),
    path('my-feed/', UserFeedAPIView.as_view(), name='user-feed'),
    path('public-feed/', PublicFeedAPIView.as_view(), name='public-feed'),
    path('article-stats/', ArticleStatsAPIView.as_view(), name='article-stats'),
]
