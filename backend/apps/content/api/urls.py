from django.urls import path, include
from apps.content.api.views import (
    ArticleListCreateAPIView, ArticleDetailAPIView,
    QuizListCreateAPIView, QuizDetailAPIView, QuizSubmitAPIView,

    FeedAPIView, UserFeedAPIView, PublicFeedAPIView, ArticleStatsAPIView
)

urlpatterns = [
    # Articles
    path('articles/', ArticleListCreateAPIView.as_view(), name='article-list'),
    path('articles/<slug:slug>/', ArticleDetailAPIView.as_view(), name='article-detail'),

    # Quizzes
    path('quizzes/', QuizListCreateAPIView.as_view(), name='quiz-list'),
    path('quizzes/<int:pk>/', QuizDetailAPIView.as_view(), name='quiz-detail'),
    path('quizzes/<int:pk>/submit/', QuizSubmitAPIView.as_view(), name='quiz-submit'),



    # Feeds & Stats
    path('feed/', FeedAPIView.as_view(), name='feed'),
    path('my-feed/', UserFeedAPIView.as_view(), name='user-feed'),
    path('public-feed/', PublicFeedAPIView.as_view(), name='public-feed'),
    path('article-stats/', ArticleStatsAPIView.as_view(), name='article-stats'),
]
