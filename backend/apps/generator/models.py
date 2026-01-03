from django.db import models
from apps.accounts.models import User
from apps.business.models import Company

class UserWebsiteConfig(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='website_config')
    template_choice = models.CharField(max_length=50)
    settings_json = models.JSONField(default=dict) 
    qr_code = models.ImageField(upload_to='user_qrs/', blank=True)

class CompanyWebsiteConfig(models.Model):
    company = models.OneToOneField(Company, on_delete=models.CASCADE, related_name='website_config')
    template_choice = models.CharField(max_length=50)
    settings_json = models.JSONField(default=dict) 
    custom_domain = models.CharField(max_length=255, null=True, blank=True)
    qr_code = models.ImageField(upload_to='company_qrs/', blank=True)
