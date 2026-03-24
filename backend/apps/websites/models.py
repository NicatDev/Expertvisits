from django.db import models
from apps.accounts.models import User

class UserWebsite(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='website')
    template_id = models.IntegerField()

    def __str__(self):
        return f"Website for {self.user.username} (Template: {self.template_id})"
