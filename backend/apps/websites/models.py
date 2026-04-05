from django.db import models
from apps.accounts.models import User

class UserWebsite(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='website')
    banner = models.ImageField(upload_to='banners/', null=True, blank=True)
    
    template_id = models.IntegerField()
    is_active = models.BooleanField(default=False)
    is_paid = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    section_visibility = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"Website for {self.user.username} (Template: {self.template_id})"
