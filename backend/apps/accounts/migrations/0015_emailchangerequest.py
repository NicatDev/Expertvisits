import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0014_user_timezone'),
    ]

    operations = [
        migrations.CreateModel(
            name='EmailChangeRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('new_email', models.EmailField(max_length=254)),
                ('code', models.CharField(max_length=6)),
                ('expires_at', models.DateTimeField()),
                (
                    'user',
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='email_change_request',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
    ]
