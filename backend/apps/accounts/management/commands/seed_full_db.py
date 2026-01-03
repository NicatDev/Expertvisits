import os
import random
from django.core.management.base import BaseCommand
from django.core.files import File
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from apps.content.models import Article, Quiz
from apps.interactions.models import Comment, Like
from apps.accounts.models import Category, SubCategory

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with users, articles, quizzes, and interactions'

    def handle(self, *args, **options):
        self.stdout.write('Flushing content...')
        Comment.objects.all().delete()
        Like.objects.all().delete()
        Article.objects.all().delete()
        Quiz.objects.all().delete()
        User.objects.all().delete()
        
        logo_path = r'c:\Users\Boss\OneDrive\Desktop\Expert_visits_all\frontend_platform\public\logo.png'
        if not os.path.exists(logo_path):
             self.stdout.write(self.style.ERROR(f'Logo not found at {logo_path}'))
             return

        self.stdout.write('Creating users...')
        users = []
        
        # Admin User
        admin = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='123123',
            first_name='Admin',
            last_name='User',
            is_active=True
        )
        with open(logo_path, 'rb') as f:
            admin.avatar.save('avatar_admin.png', File(f), save=True)
        users.append(admin)
        
        # Other Users
        for i in range(1, 3): 
             u = User.objects.create_user(
                 username=f'user{i}',
                 email=f'user{i}@example.com',
                 password='123123',
                 first_name=f'User',
                 last_name=f'{i}',
                 is_active=True
             )
             with open(logo_path, 'rb') as f:
                u.avatar.save(f'avatar_user{i}.png', File(f), save=True)
             users.append(u)
        
        # Categories
        cat, _ = Category.objects.get_or_create(name='General', defaults={'slug': 'general'})
        sub_cat, _ = SubCategory.objects.get_or_create(category=cat, name='General Sub', defaults={'slug': 'general-sub'})

        # Content Types
        article_ctype = ContentType.objects.get_for_model(Article)
        quiz_ctype = ContentType.objects.get_for_model(Quiz)

        self.stdout.write('Creating content...')
        all_content = []
        
        for user in users:
            # 3 Articles
            for j in range(1, 4):
                with open(logo_path, 'rb') as f:
                    article = Article.objects.create( # Use create for saving properly? No, image needs save.
                        author=user,
                        title=f'Article {j} by {user.username}',
                        body=f'This is the content for article {j} written by {user.username}. It is a very interesting article about things.',
                        sub_category=sub_cat 
                    )
                    article.image.save(f'article_{user.username}_{j}.png', File(f), save=True)
                    all_content.append((article, article_ctype))
            
            # 1 Quiz
            quiz = Quiz.objects.create(
                author=user,
                title=f'Quiz by {user.username}',
                sub_category=sub_cat
            )
            all_content.append((quiz, quiz_ctype))

        # Interactions
        self.stdout.write('Creating interactions...')
        for obj, ctype in all_content:
            for u in users:
                 if u != obj.author:
                     # Like
                     Like.objects.create(
                         user=u,
                         content_type=ctype,
                         object_id=obj.id
                     )
                     
                     # Comment (only for articles/quizzes generally, but generic relation allows all)
                     Comment.objects.create(
                         user=u,
                         content_type=ctype,
                         object_id=obj.id,
                         text=f'Great post, {obj.author.username}!'
                     )

        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))
