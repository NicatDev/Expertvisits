from django.db import models
from django.contrib.auth.models import AbstractUser
from core.utils import custom_slugify
from core.utils.images import compress_image

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, db_index=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = custom_slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class SubCategory(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='subcategories')
    name = models.CharField(max_length=100)
    profession = models.CharField(max_length=100, null=True, blank=True)
    slug = models.SlugField(unique=True, db_index=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = custom_slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class User(AbstractUser):
    profession_sub_category = models.ForeignKey(SubCategory, on_delete=models.SET_NULL, null=True, db_index=True, blank=True)
    interests = models.ManyToManyField(SubCategory, related_name="interested_users", blank=True)
    following = models.ManyToManyField('self', symmetrical=False, related_name='followers', blank=True)
    is_service_open = models.BooleanField(default=False, db_index=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    cover_image = models.ImageField(upload_to='covers/', null=True, blank=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    work_hours_start = models.TimeField(null=True, blank=True)
    work_hours_end = models.TimeField(null=True, blank=True)
    working_days = models.JSONField(default=list) # ["Monday", "Tuesday", etc.]
    birth_day = models.DateField(null=True, blank=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    summary = models.TextField(blank=True, null=True)

    def default_open_to():
        return ["freelance"]

    open_to = models.JSONField(default=default_open_to, blank=True)

    # Settings / Preferences
    is_searchable = models.BooleanField(default=True)
    show_phone_number = models.BooleanField(default=False)
    notify_email_general = models.BooleanField(default=False)
    notify_meeting_reminder_1h = models.BooleanField(default=False)
    notify_meeting_reminder_15m = models.BooleanField(default=False)
    notify_new_follower = models.BooleanField(default=False)
    notify_updates = models.BooleanField(default=False)

    def __str__(self):
        return self.username

    def save(self, *args, **kwargs):
        if self.pk:
            old = User.objects.filter(pk=self.pk).first()
            if old:
                if old.avatar != self.avatar:
                     compress_image(self.avatar)
                if old.cover_image != self.cover_image:
                     compress_image(self.cover_image)
        else:
             compress_image(self.avatar)
             compress_image(self.cover_image)
        super().save(*args, **kwargs)

class VerificationCode(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verification_codes')
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} - {self.code}"

class RegistrationSession(models.Model):
    email = models.EmailField(unique=True, db_index=True)
    code = models.CharField(max_length=6)
    user_data = models.JSONField() # Stores username, password, fields, etc.
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Session: {self.email}"
