from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.content.api.views import ArticleViewSet, QuizViewSet, SurveyViewSet, FeedView

router = DefaultRouter()
router.register(r'articles', ArticleViewSet)
router.register(r'quizzes', QuizViewSet)
router.register(r'surveys', SurveyViewSet)

urlpatterns = [
    path('feed/', FeedView.as_view(), name='feed'),
    path('', include(router.urls)),
]
