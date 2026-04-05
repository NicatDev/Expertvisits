from django.db import models
from apps.accounts.models import User, SubCategory
from apps.accounts.models import User, SubCategory
from core.utils import custom_slugify
from core.utils.images import compress_image

class Company(models.Model):
    owner = models.OneToOneField(User, on_delete=models.CASCADE, related_name='company')
    name = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(unique=True, db_index=True)
    logo = models.ImageField(upload_to='company_logos/', null=True, blank=True)
    cover_image = models.ImageField(upload_to='company_covers/', null=True, blank=True)
    summary = models.TextField()
    founded_at = models.DateField()
    email = models.EmailField(db_index=True)
    phone = models.CharField(max_length=50, blank=True,null=True)
    website_url = models.URLField(blank=True,null=True)
    address = models.CharField(max_length=500, blank=True,null=True)
    linkedin_url = models.URLField(blank=True,null=True)
    instagram_url = models.URLField(blank=True)
    facebook_url = models.URLField(blank=True)
    
    SIZE_CHOICES = [
        ('1-10', '1-10'),
        ('11-50', '11-50'),
        ('51-200', '51-200'),
        ('201-500', '201-500'),
        ('501-1000', '501-1000'),
        ('1000+', '1000+'),
    ]
    company_size = models.CharField(max_length=20, choices=SIZE_CHOICES, default='1-10', null=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = custom_slugify(self.name)
        
        if self.pk:
            old = Company.objects.filter(pk=self.pk).first()
            if old:
                if old.logo != self.logo:
                    compress_image(self.logo)
                if old.cover_image != self.cover_image:
                    compress_image(self.cover_image)
        else:
            compress_image(self.logo)
            compress_image(self.cover_image)

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class CompanyRegistrationPending(models.Model):
    """Holds company draft until the company email is verified (6-digit code)."""

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="company_registration_pending",
    )
    email = models.EmailField(db_index=True)
    code = models.CharField(max_length=6)
    expires_at = models.DateTimeField(db_index=True)
    name = models.CharField(max_length=255)
    summary = models.TextField()
    founded_at = models.DateField()
    company_size = models.CharField(max_length=20, choices=Company.SIZE_CHOICES, default="1-10")
    phone = models.CharField(max_length=50, blank=True, null=True)
    address = models.CharField(max_length=500, blank=True, null=True)
    website_url = models.URLField(blank=True, null=True)
    logo = models.ImageField(upload_to="company_registration_logos/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.user_id} → {self.email}"


class CompanyNews(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='news')
    title = models.CharField(max_length=255)
    image = models.ImageField(upload_to='company_news/', null=True, blank=True)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.pk:
            old = CompanyNews.objects.filter(pk=self.pk).first()
            if old and old.image != self.image:
                compress_image(self.image)
        else:
            compress_image(self.image)
        super().save(*args, **kwargs)

from core.utils.language import detect_language

class Vacancy(models.Model):
    LANGUAGE_CHOICES = [
        ('az', 'Azerbaijani'),
        ('en', 'English'),
        ('ru', 'Russian'),
    ]
    LISTING_TYPE = [('job', 'Job'), ('internship', 'Internship')]
    JOB_TYPE = [('full-time', 'Full-time'), ('part-time', 'Part-time')]
    WORK_MODE = [('remote', 'Remote'), ('hybrid', 'Hybrid'), ('office', 'Office')]

    class PostedAs(models.TextChoices):
        COMPANY = "company", "Company"
        INDIVIDUAL = "individual", "Individual"

    posted_as = models.CharField(
        max_length=20,
        choices=PostedAs.choices,
        default=PostedAs.COMPANY,
        db_index=True,
    )
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="vacancies",
        null=True,
        blank=True,
    )
    posted_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posted_vacancies', null=True, blank=True)
    employer_display_name = models.CharField(max_length=255, blank=True)
    employer_email = models.EmailField(blank=True)
    employer_phone = models.CharField(max_length=50, blank=True)
    employer_website = models.URLField(blank=True, null=True)
    employer_logo = models.ImageField(upload_to="vacancy_employer_logos/", null=True, blank=True)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    sub_category = models.ForeignKey(SubCategory, on_delete=models.SET_NULL, null=True, db_index=True)
    listing_type = models.CharField(choices=LISTING_TYPE, max_length=20, db_index=True)
    language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default='az', db_index=True)

    def save(self, *args, **kwargs):
        # Auto-detect language if not set or default
        if not self.language or self.language == 'az':
            desc = (self.description or "")[:500]
            text_to_detect = f"{self.title} {desc}"
            self.language = detect_language(text_to_detect)

        if self.pk:
            old = Vacancy.objects.filter(pk=self.pk).first()
            if old and old.employer_logo != self.employer_logo and self.employer_logo:
                compress_image(self.employer_logo)
        elif self.employer_logo:
            compress_image(self.employer_logo)

        if not self.slug:
            from core.utils import custom_slugify
            base_slug = custom_slugify(self.title)
            slug = base_slug
            counter = 1
            while Vacancy.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)
    title = models.CharField(max_length=255, db_index=True)
    salary_range = models.CharField(max_length=100, null=True, blank=True)
    job_type = models.CharField(choices=JOB_TYPE, max_length=20)
    work_mode = models.CharField(choices=WORK_MODE, max_length=20)
    location = models.CharField(max_length=255)
    description = models.TextField(default='')
    posted_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateField()

    def __str__(self):
        return self.title

class VacancyApplication(models.Model):
    STATUS_CHOICES = [('pending', 'Pending'), ('accepted', 'Accepted'), ('rejected', 'Rejected')]
    
    vacancy = models.ForeignKey(Vacancy, on_delete=models.CASCADE, related_name='applications')
    applicant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='job_applications')
    motivation_letter = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('vacancy', 'applicant')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.applicant.username} -> {self.vacancy.title}"

class OngoingProject(models.Model):
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_projects')
    participants = models.ManyToManyField(User, related_name='joined_projects', blank=True)
    title = models.CharField(max_length=255, db_index=True)
    image_logo = models.ImageField(upload_to='project_logos/', null=True, blank=True)
    description = models.TextField()
    is_active = models.BooleanField(default=True)

class ProjectInternalPost(models.Model):
    project = models.ForeignKey(OngoingProject, related_name="internal_posts", on_delete=models.CASCADE)
    description = models.TextField()
    image = models.ImageField(upload_to='project_posts/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class ProjectRequest(models.Model):
    STATUS_CHOICES = [('pending', 'Pending'), ('accepted', 'Accepted'), ('rejected', 'Rejected')]
    project = models.ForeignKey(OngoingProject, on_delete=models.CASCADE, related_name='requests')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()

class WhoWeAre(models.Model):
    company = models.OneToOneField(Company, on_delete=models.CASCADE, related_name='who_we_are')
    title = models.CharField(max_length=255)
    description = models.TextField()
    image = models.ImageField(upload_to='company_sections/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.pk:
            old = WhoWeAre.objects.filter(pk=self.pk).first()
            if old and old.image != self.image:
                compress_image(self.image)
        else:
            compress_image(self.image)
        super().save(*args, **kwargs)

    def save(self, *args, **kwargs):
        if self.pk:
            old = OurValues.objects.filter(pk=self.pk).first()
            if old and old.image != self.image:
                compress_image(self.image)
        else:
            compress_image(self.image)
        super().save(*args, **kwargs)

class WhatWeDo(models.Model):
    company = models.OneToOneField(Company, on_delete=models.CASCADE, related_name='what_we_do')
    title = models.CharField(max_length=255)
    description = models.TextField()
    image = models.ImageField(upload_to='company_sections/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class OurValues(models.Model):
    company = models.OneToOneField(Company, on_delete=models.CASCADE, related_name='our_values')
    title = models.CharField(max_length=255)
    description = models.TextField()
    image = models.ImageField(upload_to='company_sections/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class CompanyService(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='services')
    title = models.CharField(max_length=255)
    description = models.TextField()
    image = models.ImageField(upload_to='company_services/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.pk:
            old = CompanyService.objects.filter(pk=self.pk).first()
            if old and old.image != self.image:
                compress_image(self.image)
        else:
            compress_image(self.image)
        super().save(*args, **kwargs)
