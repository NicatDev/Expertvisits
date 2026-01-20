from django.db import models
from apps.accounts.models import User, SubCategory
from core.utils import custom_slugify

from django.contrib.contenttypes.fields import GenericRelation
from apps.interactions.models import Like, Comment

class Article(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='articles')
    sub_category = models.ForeignKey(SubCategory, on_delete=models.SET_NULL, null=True, db_index=True)
    title = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(unique=True, db_index=True, max_length=255)
    image = models.ImageField(upload_to='articles/', blank=True, null=True)
    body = models.TextField()
    likes = GenericRelation(Like)
    comments = GenericRelation(Comment)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
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
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

class Quiz(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quizzes')
    sub_category = models.ForeignKey(SubCategory, on_delete=models.SET_NULL, null=True)
    title = models.CharField(max_length=255)
    likes = GenericRelation(Like)
    comments = GenericRelation(Comment)
    created_at = models.DateTimeField(auto_now_add=True)

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


