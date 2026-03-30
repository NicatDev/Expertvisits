from django.db import models
from apps.accounts.models import User

class Experience(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='experiences')
    position = models.CharField(max_length=255, db_index=True)
    company_name = models.CharField(max_length=255, db_index=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.position} at {self.company_name}"

class Education(models.Model):
    DEGREE_CHOICES = [
        ('bachelor', 'Bakalavr'),
        ('master', 'Magistr'),
        ('doctorate', 'Doktorantura'),
        ('secondary', 'Orta'),
        ('full_secondary', 'Tam orta'),
        ('vocational', 'Peşə təhsili'),
        ('certification', 'Təhsil Artırma/Sertifikat')
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='educations')
    degree_type = models.CharField(max_length=20, choices=DEGREE_CHOICES, db_index=True)
    institution = models.CharField(max_length=255)
    field_of_study = models.CharField(max_length=255, db_index=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.get_degree_type_display()} in {self.field_of_study}"

class Skill(models.Model):
    SKILL_TYPES = [('soft', 'Soft'), ('hard', 'Hard')]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='skills')
    name = models.CharField(max_length=100, db_index=True)
    skill_type = models.CharField(max_length=10, choices=SKILL_TYPES)

    def __str__(self):
        return self.name

class Language(models.Model):
    LEVEL_CHOICES = [
        ('a1', 'A1'), ('a2', 'A2'),
        ('b1', 'B1'), ('b2', 'B2'),
        ('c1', 'C1'), ('c2', 'C2'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='languages')
    name = models.CharField(max_length=100)
    level = models.CharField(max_length=2, choices=LEVEL_CHOICES)

    def __str__(self):
        return f"{self.name} ({self.get_level_display()})"

class Certificate(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='certificates')
    name = models.CharField(max_length=255)
    issuing_organization = models.CharField(max_length=255)
    issue_date = models.DateField()
    # url or file? "Sertifkatlar ucun model ve veren qurum ve tarix olsun"
    
    def __str__(self):
        return self.name

class QuickNote(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='quick_note')
    content = models.TextField()

    def __str__(self):
        return f"Note for {self.user.username}"

class Service(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='services')
    title = models.CharField(max_length=255)
    description = models.TextField()
    steps = models.JSONField(default=list, blank=True)

    def __str__(self):
        return self.title

class Project(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects')
    title = models.CharField(max_length=255)
    description = models.TextField()
    date = models.DateField()
    image = models.ImageField(upload_to='projects/images/', null=True, blank=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return self.title
