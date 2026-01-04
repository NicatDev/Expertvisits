from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.content.api.views import ArticleStatsView, ArticleViewSet, QuizViewSet, SurveyViewSet, FeedView, UserFeedView, PublicFeedView

router = DefaultRouter()
router.register(r'articles', ArticleViewSet)
router.register(r'quizzes', QuizViewSet)
router.register(r'surveys', SurveyViewSet)

urlpatterns = [
    path('feed/', FeedView.as_view(), name='feed'),
    path('my-feed/', UserFeedView.as_view(), name='user-feed'),
    path('public-feed/', PublicFeedView.as_view(), name='public-feed'),
    path('article-stats/', ArticleStatsView.as_view(), name='article-stats'),
    path('', include(router.urls)),
]
