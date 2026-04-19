from django.db import models
from django.contrib.auth.models import AbstractUser
from core.utils import custom_slugify
from core.utils.images import compress_image, create_compressed_avatar
from core.utils.language import detect_language

class Category(models.Model):
    name_az = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100)
    name_ru = models.CharField(max_length=100)
    external_id = models.CharField(
        max_length=64, unique=True, null=True, blank=True, db_index=True
    )
    slug = models.SlugField(unique=True, db_index=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = custom_slugify(self.name_en)
        super().save(*args, **kwargs)

    @property
    def name(self):
        return self.name_az

    def __str__(self):
        return self.name_az

class SubCategory(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='subcategories')
    name_az = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100)
    name_ru = models.CharField(max_length=100)
    profession_az = models.CharField(max_length=100, null=True, blank=True)
    profession_en = models.CharField(max_length=100, null=True, blank=True)
    profession_ru = models.CharField(max_length=100, null=True, blank=True)
    external_id = models.CharField(
        max_length=64, unique=True, null=True, blank=True, db_index=True
    )
    slug = models.SlugField(unique=True, db_index=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = custom_slugify(self.name_en)
            slug = base_slug
            counter = 1
            # Ensure slug is unique within the entire SubCategory table
            while SubCategory.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def name(self):
        return self.name_az

    @property
    def profession(self):
        return self.profession_az

    def __str__(self):
        return self.name_az

class User(AbstractUser):
    profession_sub_category = models.ForeignKey(SubCategory, on_delete=models.SET_NULL, null=True, db_index=True, blank=True)
    interests = models.ManyToManyField(SubCategory, related_name="interested_users", blank=True)
    following = models.ManyToManyField('self', symmetrical=False, related_name='followers', blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    avatar_compressed = models.ImageField(upload_to='avatars_compressed/', null=True, blank=True)
    cover_image = models.ImageField(upload_to='covers/', null=True, blank=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    birth_day = models.DateField(null=True, blank=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    summary = models.TextField(blank=True, null=True)
    timezone = models.CharField(max_length=50, default='UTC', blank=True)

    def default_open_to():
        return ["freelance"]

    open_to = models.JSONField(default=default_open_to, blank=True)

    # Settings / Preferences
    is_searchable = models.BooleanField(default=True)
    show_phone_number = models.BooleanField(default=False)
    notify_email_general = models.BooleanField(default=False)
    notify_new_follower = models.BooleanField(default=False)
    notify_updates = models.BooleanField(default=False)

    def __str__(self):
        return self.username

    language = models.CharField(max_length=10, default='az', blank=True, null=True)

    def save(self, *args, **kwargs):
        if self.summary:
            detected_lang = detect_language(self.summary)
            self.language = detected_lang
        else:
            if not self.language:
                self.language = 'az'
                
        if self.pk:
            old = User.objects.filter(pk=self.pk).first()
            if old:
                # Yetim thumbnail: əsas avatar yoxdursa sıxılmış da təmizlənsin
                if not self.avatar and self.avatar_compressed:
                    self.avatar_compressed = None
                if old.avatar != self.avatar:
                    if self.avatar:
                        compress_image(self.avatar, format='PNG')
                        compressed = create_compressed_avatar(self.avatar)
                        if compressed:
                            self.avatar_compressed.save(compressed.name, compressed, save=False)
                    else:
                        # Main avatar silinəndə thumbnail də təmizlənməlidir (UI avatar_compressed-ə üstünlük verir)
                        self.avatar_compressed = None
                elif self.avatar and not self.avatar_compressed:
                    # Case: Avatar exists but compressed doesn't (backfill)
                    compressed = create_compressed_avatar(self.avatar)
                    if compressed:
                        self.avatar_compressed.save(compressed.name, compressed, save=False)

                if old.cover_image != self.cover_image:
                     compress_image(self.cover_image, format='WEBP')
        else:
             compress_image(self.avatar, format='PNG')
             # New user with avatar
             compressed = create_compressed_avatar(self.avatar)
             if compressed:
                 self.avatar_compressed.save(compressed.name, compressed, save=False)
             compress_image(self.cover_image, format='WEBP')
        super().save(*args, **kwargs)

class VerificationCode(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verification_codes')
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} - {self.code}"


class EmailChangeRequest(models.Model):
    """Pending email change for a logged-in user; verified via code sent to new_email."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='email_change_request')
    new_email = models.EmailField()
    code = models.CharField(max_length=6)
    expires_at = models.DateTimeField()

    def __str__(self):
        return f"{self.user.username} -> {self.new_email}"

class RegistrationSession(models.Model):
    email = models.EmailField(unique=True, db_index=True)
    code = models.CharField(max_length=6)
    user_data = models.JSONField() # Stores username, password, fields, etc.
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Session: {self.email}"



    