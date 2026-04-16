from django.db.models import Avg, Count

from rest_framework import serializers
from apps.accounts.api.serializers import SubCategorySerializer
from apps.content.models import Article, Quiz, Question, Choice, QuizAttempt

# Define Mixin here to minimize dependencies
class ContentSerializerMixin(serializers.Serializer):
    is_liked = serializers.SerializerMethodField()
    latest_comment = serializers.SerializerMethodField()
    author_avatar = serializers.SerializerMethodField()
    author_avatar_compressed = serializers.SerializerMethodField()

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
                    "avatar": comment.user.avatar.url if comment.user.avatar else None,
                    "avatar_compressed": comment.user.avatar_compressed.url if comment.user.avatar_compressed else None
                }
            }
        return None

    def get_author_avatar(self, obj):
        if obj.author.avatar:
            return obj.author.avatar.url
        return None

    def get_author_avatar_compressed(self, obj):
        if obj.author.avatar_compressed:
            return obj.author.avatar_compressed.url
        return None

class ArticleSerializer(serializers.ModelSerializer, ContentSerializerMixin):
    author = serializers.StringRelatedField(read_only=True)
    slug = serializers.SlugField(read_only=True)
    likes_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    sub_category = SubCategorySerializer(read_only=True)

    class Meta:
        model = Article
        fields = ['id', 'title', 'slug', 'image', 'body', 'sub_category', 'language', 'author', 'author_avatar', 'author_avatar_compressed', 'created_at', 'likes_count', 'comments_count', 'is_liked', 'latest_comment']

    def validate_body(self, value):
        import bleach

        # TipTap / rich text: əvvəl yalnız məhdud teqlər idi → pre/code/blockquote/siyahılar
        # silinirdi, detal səhifədə bloklar adi mətn kimi görünürdü.
        allowed_tags = [
            'h2',
            'h3',
            'h4',
            'p',
            'br',
            'b',
            'strong',
            'i',
            'em',
            'u',
            's',
            'strike',
            'del',
            'blockquote',
            'ul',
            'ol',
            'li',
            'pre',
            'code',
            'a',
            'hr',
            'table',
            'thead',
            'tbody',
            'tr',
            'th',
            'td',
            'caption',
        ]
        allowed_attributes = {
            'a': ['href', 'title', 'rel', 'target'],
            'code': ['class'],
            'pre': ['class'],
            'th': ['colspan', 'rowspan'],
            'td': ['colspan', 'rowspan'],
        }
        cleaned_body = bleach.clean(
            value,
            tags=allowed_tags,
            attributes=allowed_attributes,
            strip=True,
            protocols=['http', 'https', 'mailto'],
        )
        return cleaned_body

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
    slug = serializers.SlugField(read_only=True)
    questions = QuestionSerializer(many=True)
    likes_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    sub_category = SubCategorySerializer(read_only=True)

    class Meta:
        model = Quiz
        fields = [
            'id',
            'slug',
            'title',
            'sub_category',
            'author',
            'author_avatar',
            'author_avatar_compressed',
            'questions',
            'created_at',
            'likes_count',
            'comments_count',
            'is_liked',
            'latest_comment',
            'participation_count',
            'is_participated',
            'my_attempt_count',
        ]

    participation_count = serializers.SerializerMethodField()
    is_participated = serializers.SerializerMethodField()
    my_attempt_count = serializers.SerializerMethodField()

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
        return obj.quizattempt_set.values('user').distinct().count()

    def get_is_participated(self, obj):
        user = self.context.get('request').user if 'request' in self.context else None
        if user and user.is_authenticated:
            return obj.quizattempt_set.filter(user=user).exists()
        return False

    def get_my_attempt_count(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if user and user.is_authenticated:
            return obj.quizattempt_set.filter(user=user).count()
        return 0


class QuizDetailSerializer(QuizSerializer):
    """Detail page: stats + current user's attempts list."""

    quiz_stats = serializers.SerializerMethodField()
    my_attempts = serializers.SerializerMethodField()

    class Meta(QuizSerializer.Meta):
        fields = QuizSerializer.Meta.fields + ['quiz_stats', 'my_attempts']

    def get_quiz_stats(self, obj):
        n = obj.questions.count()
        agg = QuizAttempt.objects.filter(quiz=obj).aggregate(
            avg_score=Avg('score'),
            total_attempts=Count('id'),
            unique_participants=Count('user', distinct=True),
        )
        avg_pct = 0
        if n > 0 and agg['avg_score'] is not None:
            avg_pct = round((agg['avg_score'] / n) * 100)
        return {
            'average_percent': avg_pct,
            'total_attempts': agg['total_attempts'] or 0,
            'unique_participants': agg['unique_participants'] or 0,
        }

    def get_my_attempts(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return []
        attempts = QuizAttempt.objects.filter(quiz=obj, user=request.user).order_by('-created_at')
        return QuizAttemptSerializer(attempts, many=True).data

class QuizAttemptSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    percentage = serializers.SerializerMethodField()

    class Meta:
        model = QuizAttempt
        fields = ['id', 'score', 'created_at', 'user', 'answers_json', 'percentage']

    def get_user(self, obj):
        return {
            "id": obj.user.id,
            "username": obj.user.username,
            "full_name": obj.user.get_full_name(),
            "avatar": obj.user.avatar.url if obj.user.avatar else None,
            "avatar_compressed": obj.user.avatar_compressed.url if obj.user.avatar_compressed else None
        }

    def get_percentage(self, obj):
        total = obj.quiz.questions.count()
        if total == 0:
            return 0
        return round((obj.score / total) * 100)

class ChoiceReviewSerializer(serializers.ModelSerializer):
    """Exposes is_correct for review purposes"""
    class Meta:
        model = Choice
        fields = ['id', 'text', 'is_correct']

class QuestionReviewSerializer(serializers.ModelSerializer):
    choices = ChoiceReviewSerializer(many=True)
    
    class Meta:
        model = Question
        fields = ['id', 'text', 'choices']

class QuizReviewSerializer(serializers.ModelSerializer):
    """Serializer for reviewing a quiz attempt (includes correct answers)"""
    questions = QuestionReviewSerializer(many=True)
    user_attempt = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = ['id', 'slug', 'title', 'questions', 'user_attempt']

    def get_user_attempt(self, obj):
        # We expect 'attempt' to be passed in context or attached to obj
        attempt = self.context.get('attempt')
        if attempt:
            return QuizAttemptSerializer(attempt).data
        return None



from apps.content.models import Poll, PollVote, PollOption, Collection, CollectionItem

class PollOptionSerializer(serializers.ModelSerializer):
    percentage = serializers.SerializerMethodField()
    is_voted = serializers.SerializerMethodField()

    class Meta:
        model = PollOption
        fields = ['id', 'text', 'percentage', 'is_voted']

    def get_percentage(self, obj):
        total_votes = obj.poll.votes.count()
        if total_votes == 0:
            return 0
        return round((obj.votes.count() / total_votes) * 100)

    def get_is_voted(self, obj):
        request = self.context.get('request') if self.context else None
        user = request.user if request and request.user.is_authenticated else None
        if not user:
            return False
        return PollVote.objects.filter(option_id=obj.pk, user_id=user.pk).exists()


class PollSerializer(serializers.ModelSerializer, ContentSerializerMixin):
    author = serializers.StringRelatedField(read_only=True)
    options = PollOptionSerializer(many=True, read_only=True)
    total_votes = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()
    likes_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    sub_category = SubCategorySerializer(read_only=True)

    class Meta:
        model = Poll
        fields = [
            'id',
            'question',
            'sub_category',
            'options',
            'author',
            'author_avatar',
            'author_avatar_compressed',
            'created_at',
            'total_votes',
            'user_vote',
            'likes_count',
            'comments_count',
            'is_liked',
            'latest_comment',
        ]

    def get_total_votes(self, obj):
        return obj.votes.count()

    def get_user_vote(self, obj):
        request = self.context.get('request') if self.context else None
        if not request or not request.user.is_authenticated:
            return None
        option_id = (
            PollVote.objects.filter(poll_id=obj.pk, user_id=request.user.pk)
            .values_list('option_id', flat=True)
            .first()
        )
        return option_id

class PollCreateSerializer(serializers.ModelSerializer):
    options = serializers.ListField(child=serializers.CharField(), write_only=True)

    class Meta:
        model = Poll
        fields = ['id', 'question', 'options']

    def create(self, validated_data):
        options_data = validated_data.pop('options')
        poll = Poll.objects.create(**validated_data)
        for option_text in options_data:
            PollOption.objects.create(poll=poll, text=option_text)
        return poll

class PollVoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PollVote
        fields = ['id', 'option']


class CollectionItemWriteSerializer(serializers.Serializer):
    content_type = serializers.ChoiceField(choices=['article', 'quiz'])
    content_id = serializers.IntegerField(min_value=1)
    order = serializers.IntegerField(min_value=0, required=False)


class CollectionItemSerializer(serializers.ModelSerializer):
    content_type = serializers.SerializerMethodField()
    content_id = serializers.SerializerMethodField()
    title = serializers.SerializerMethodField()
    slug = serializers.SerializerMethodField()
    author = serializers.SerializerMethodField()
    created_at = serializers.SerializerMethodField()

    class Meta:
        model = CollectionItem
        fields = ['id', 'order', 'content_type', 'content_id', 'title', 'slug', 'author', 'created_at']

    def get_content_type(self, obj):
        return 'article' if obj.article_id else 'quiz'

    def get_content_id(self, obj):
        return obj.article_id if obj.article_id else obj.quiz_id

    def get_title(self, obj):
        return obj.article.title if obj.article_id else obj.quiz.title

    def get_slug(self, obj):
        return obj.article.slug if obj.article_id else obj.quiz.slug

    def get_author(self, obj):
        u = obj.article.author if obj.article_id else obj.quiz.author
        return str(u) if u else None

    def get_created_at(self, obj):
        d = obj.article.created_at if obj.article_id else obj.quiz.created_at
        return d


class CollectionSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    is_owner = serializers.SerializerMethodField()
    items = CollectionItemSerializer(many=True, read_only=True)
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Collection
        fields = [
            'id',
            'slug',
            'title',
            'summary',
            'author',
            'view_count',
            'item_count',
            'is_owner',
            'created_at',
            'updated_at',
            'items',
        ]

    def get_is_owner(self, obj):
        request = self.context.get('request')
        return bool(request and request.user.is_authenticated and obj.author_id == request.user.id)

    def get_item_count(self, obj):
        prefetched = getattr(obj, 'items', None)
        if prefetched is not None and hasattr(prefetched, 'all'):
            return prefetched.all().count()
        return obj.items.count()


class CollectionCreateUpdateSerializer(serializers.ModelSerializer):
    items = CollectionItemWriteSerializer(many=True, required=False)

    class Meta:
        model = Collection
        fields = ['title', 'summary', 'items']

    def validate_items(self, items):
        seen = set()
        for idx, item in enumerate(items):
            key = (item['content_type'], item['content_id'])
            if key in seen:
                raise serializers.ValidationError(f'Duplicate item at position {idx + 1}.')
            seen.add(key)
        return items

    def _resolve_item(self, payload):
        ctype = payload['content_type']
        cid = payload['content_id']
        if ctype == 'article':
            article = Article.objects.filter(id=cid).first()
            if not article:
                raise serializers.ValidationError({'items': [f'Article #{cid} not found.']})
            return {'article': article, 'quiz': None}
        quiz = Quiz.objects.filter(id=cid).first()
        if not quiz:
            raise serializers.ValidationError({'items': [f'Quiz #{cid} not found.']})
        return {'article': None, 'quiz': quiz}

    def _save_items(self, collection, items):
        CollectionItem.objects.filter(collection=collection).delete()
        for idx, payload in enumerate(items):
            target = self._resolve_item(payload)
            CollectionItem.objects.create(
                collection=collection,
                article=target['article'],
                quiz=target['quiz'],
                order=payload.get('order', idx),
            )

    def create(self, validated_data):
        items = validated_data.pop('items', [])
        collection = Collection.objects.create(**validated_data)
        self._save_items(collection, items)
        return collection

    def update(self, instance, validated_data):
        items = validated_data.pop('items', None)
        new_title = validated_data.get('title', instance.title)
        title_changed = new_title != instance.title
        instance.title = new_title
        instance.summary = validated_data.get('summary', instance.summary)
        if title_changed:
            instance.slug = ''
        instance.save()
        if items is not None:
            self._save_items(instance, items)
        return instance
