from rest_framework import serializers
from apps.content.models import Article, Quiz, Question, Choice

# Define Mixin here to minimize dependencies
class ContentSerializerMixin(serializers.Serializer):
    is_liked = serializers.SerializerMethodField()
    latest_comment = serializers.SerializerMethodField()
    author_avatar = serializers.SerializerMethodField()

    def get_is_liked(self, obj):
        user = self.context.get('request', None).user if self.context.get('request') else None
        if user and user.is_authenticated:
            return obj.likes.filter(user=user).exists()
        return False

    def get_latest_comment(self, obj):
        comment = obj.comments.filter(parent__isnull=True).order_by('-created_at').first()
        if comment:
            return {
                "id": comment.id,
                "text": comment.text,
                "user": {
                    "username": comment.user.username,
                    "avatar": comment.user.avatar.url if comment.user.avatar else None
                }
            }
        return None

    def get_author_avatar(self, obj):
        if obj.author.avatar:
            return obj.author.avatar.url
        return None

class ArticleSerializer(serializers.ModelSerializer, ContentSerializerMixin):
    author = serializers.StringRelatedField(read_only=True)
    slug = serializers.SlugField(read_only=True)
    likes_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Article
        fields = ['id', 'title', 'slug', 'image', 'body', 'sub_category', 'author', 'author_avatar', 'created_at', 'likes_count', 'comments_count', 'is_liked', 'latest_comment']

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'text', 'is_correct']

class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True)

    class Meta:
        model = Question
        fields = ['id', 'text', 'choices']

class QuizSerializer(serializers.ModelSerializer, ContentSerializerMixin):
    author = serializers.StringRelatedField(read_only=True)
    questions = QuestionSerializer(many=True)
    likes_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Quiz
        fields = ['id', 'title', 'sub_category', 'author', 'author_avatar', 'questions', 'created_at', 'likes_count', 'comments_count', 'is_liked', 'latest_comment', 'participation_count', 'is_participated']

    participation_count = serializers.SerializerMethodField()
    is_participated = serializers.SerializerMethodField()


    def create(self, validated_data):
        questions_data = validated_data.pop('questions')
        quiz = Quiz.objects.create(**validated_data)
        for question_data in questions_data:
            choices_data = question_data.pop('choices')
            question = Question.objects.create(quiz=quiz, **question_data)
            for choice_data in choices_data:
                Choice.objects.create(question=question, **choice_data)
        return quiz

    def get_participation_count(self, obj):
        return obj.quizattempt_set.count()

    def get_is_participated(self, obj):
        user = self.context.get('request').user if 'request' in self.context else None
        if user and user.is_authenticated:
            return obj.quizattempt_set.filter(user=user).exists()
        return False


class QuizDetailSerializer(QuizSerializer):
    """Include questions when taking the quiz"""
    pass


