from django.contrib import admin

from .models import (
    Article,
    Choice,
    Poll,
    PollOption,
    PollVote,
    Question,
    Quiz,
    QuizAttempt,
)


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "language", "created_at", "score")
    list_filter = ("language", "created_at")
    search_fields = ("title", "slug", "author__username")
    autocomplete_fields = ("author", "sub_category")
    prepopulated_fields = {"slug": ("title",)}
    date_hierarchy = "created_at"


class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 0


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("quiz", "text")
    search_fields = ("text", "quiz__title")
    autocomplete_fields = ("quiz",)
    inlines = (ChoiceInline,)


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 0
    show_change_link = True


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "created_at", "score")
    search_fields = ("title", "author__username")
    autocomplete_fields = ("author", "sub_category")
    inlines = (QuestionInline,)
    date_hierarchy = "created_at"


@admin.register(Choice)
class ChoiceAdmin(admin.ModelAdmin):
    list_display = ("question", "text", "is_correct")
    search_fields = ("text",)
    autocomplete_fields = ("question",)


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ("user", "quiz", "score", "created_at")
    list_filter = ("created_at",)
    search_fields = ("user__username", "quiz__title")
    autocomplete_fields = ("user", "quiz")
    date_hierarchy = "created_at"


class PollOptionInline(admin.TabularInline):
    model = PollOption
    extra = 0


@admin.register(Poll)
class PollAdmin(admin.ModelAdmin):
    list_display = ("question", "author", "created_at", "score")
    search_fields = ("question", "author__username")
    autocomplete_fields = ("author", "sub_category")
    inlines = (PollOptionInline,)
    date_hierarchy = "created_at"


@admin.register(PollOption)
class PollOptionAdmin(admin.ModelAdmin):
    list_display = ("poll", "text")
    search_fields = ("text",)
    autocomplete_fields = ("poll",)


@admin.register(PollVote)
class PollVoteAdmin(admin.ModelAdmin):
    list_display = ("user", "poll", "option", "created_at")
    list_filter = ("created_at",)
    search_fields = ("user__username",)
    autocomplete_fields = ("user", "poll", "option")
    date_hierarchy = "created_at"
