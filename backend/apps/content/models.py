from django.db import models
from django.db.models import Q
from apps.accounts.models import User, SubCategory
from core.utils import custom_slugify
from core.utils.images import compress_image

from django.contrib.contenttypes.fields import GenericRelation
from apps.interactions.models import Like, Comment

from core.utils.language import detect_language

class Article(models.Model):
    LANGUAGE_CHOICES = [
        ('az', 'Azerbaijani'),
        ('en', 'English'),
        ('ru', 'Russian'),
    ]
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='articles')
    sub_category = models.ForeignKey(SubCategory, on_delete=models.SET_NULL, null=True, db_index=True)
    title = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(unique=True, db_index=True, max_length=255)
    image = models.ImageField(upload_to='articles/', blank=True, null=True)
    body = models.TextField()
    language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default='az', db_index=True)
    likes = GenericRelation(Like)
    comments = GenericRelation(Comment)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    score = models.IntegerField(default=0, db_index=True)

    def save(self, *args, **kwargs):
        # Auto-detect language if not set or default
        if not self.language or self.language == 'az':
            # Check title first, it often gives good results
            text_to_detect = f"{self.title} {self.body[:500]}"
            self.language = detect_language(text_to_detect)

        if not self.slug:
            # ... existing slugify logic ...
            base_slug = custom_slugify(self.title)
            # Smart truncation (stop at word boundary, approx 50 chars)
            if len(base_slug) > 50:
                slug_part = base_slug[:50]
                if '-' in slug_part:
                    slug_part = slug_part.rsplit('-', 1)[0]
                base_slug = slug_part
            
            # Uniqueness check
            unique_slug = base_slug
            counter = 1
            while Article.objects.filter(slug=unique_slug).exclude(pk=self.pk).exists():
                unique_slug = f"{base_slug}-{counter}"
                counter += 1
            
            self.slug = unique_slug
            self.slug = unique_slug
        
        if self.pk:
            old = Article.objects.filter(pk=self.pk).first()
            if old and old.image != self.image:
                compress_image(self.image)
        else:
            compress_image(self.image)

        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

class Quiz(models.Model):
    LANGUAGE_CHOICES = [
        ('az', 'Azerbaijani'),
        ('en', 'English'),
        ('ru', 'Russian'),
    ]
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quizzes')
    sub_category = models.ForeignKey(SubCategory, on_delete=models.SET_NULL, null=True)
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, db_index=True, blank=True)
    language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default='az', db_index=True)
    likes = GenericRelation(Like)
    comments = GenericRelation(Comment)
    created_at = models.DateTimeField(auto_now_add=True)
    score = models.IntegerField(default=0, db_index=True)

    def save(self, *args, **kwargs):
        if not self.language or self.language == 'az':
            self.language = detect_language(self.title)

        if not self.slug:
            base_slug = custom_slugify(self.title)
            if len(base_slug) > 50:
                slug_part = base_slug[:50]
                if '-' in slug_part:
                    slug_part = slug_part.rsplit('-', 1)[0]
                base_slug = slug_part
            unique_slug = base_slug
            counter = 1
            while Quiz.objects.filter(slug=unique_slug).exclude(pk=self.pk).exists():
                unique_slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = unique_slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

class Question(models.Model):
    quiz = models.ForeignKey(Quiz, related_name="questions", on_delete=models.CASCADE)
    text = models.TextField()

    def __str__(self):
        return self.text[:50]

class Choice(models.Model):
    question = models.ForeignKey(Question, related_name="choices", on_delete=models.CASCADE)
    text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return self.text

class QuizAttempt(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_attempts')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    answers_json = models.JSONField() 
    score = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return f"{self.user.username} attempt on {self.quiz.title}"


class Poll(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='polls')
    sub_category = models.ForeignKey(
        SubCategory, on_delete=models.SET_NULL, null=True, blank=True, db_index=True
    )
    question = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    likes = GenericRelation(Like)
    comments = GenericRelation(Comment)
    score = models.IntegerField(default=0, db_index=True)

    def __str__(self):
        return self.question[:50]

class PollOption(models.Model):
    poll = models.ForeignKey(Poll, related_name='options', on_delete=models.CASCADE)
    text = models.CharField(max_length=255)

    def __str__(self):
        return self.text

class PollVote(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='poll_votes')
    poll = models.ForeignKey(Poll, related_name='votes', on_delete=models.CASCADE)
    option = models.ForeignKey(PollOption, related_name='votes', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'poll') # One vote per user per poll

    def __str__(self):
        return f"{self.user.username} voted on {self.poll.id}"


class Collection(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='collections')
    title = models.CharField(max_length=255, db_index=True)
    summary = models.TextField(blank=True, default='')
    slug = models.SlugField(max_length=255, unique=True, db_index=True, blank=True)
    view_count = models.PositiveIntegerField(default=0, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = custom_slugify(self.title)
            if len(base_slug) > 70:
                slug_part = base_slug[:70]
                if '-' in slug_part:
                    slug_part = slug_part.rsplit('-', 1)[0]
                base_slug = slug_part
            unique_slug = base_slug
            counter = 1
            while Collection.objects.filter(slug=unique_slug).exclude(pk=self.pk).exists():
                unique_slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = unique_slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class CollectionItem(models.Model):
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE, related_name='items')
    article = models.ForeignKey(Article, on_delete=models.CASCADE, null=True, blank=True, related_name='collection_items')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, null=True, blank=True, related_name='collection_items')
    order = models.PositiveIntegerField(default=0, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'id']
        constraints = [
            models.UniqueConstraint(
                fields=['collection', 'article'],
                condition=Q(article__isnull=False),
                name='content_collection_item_unique_article',
            ),
            models.UniqueConstraint(
                fields=['collection', 'quiz'],
                condition=Q(quiz__isnull=False),
                name='content_collection_item_unique_quiz',
            ),
        ]

    def __str__(self):
        if self.article_id:
            return f"{self.collection_id}:article:{self.article_id}"
        return f"{self.collection_id}:quiz:{self.quiz_id}"
