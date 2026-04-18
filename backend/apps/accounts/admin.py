from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from apps.profiles.models import (
    Certificate,
    Education,
    Experience,
    Language,
    Project,
    QuickNote,
    Service,
    Skill,
)

from .models import (
    Category,
    EmailChangeRequest,
    RegistrationSession,
    SubCategory,
    User,
    VerificationCode,
)


class SubCategoryInline(admin.TabularInline):
    model = SubCategory
    extra = 0
    prepopulated_fields = {"slug": ("name_en",)}
    show_change_link = True


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name_en", "name_az", "slug", "external_id")
    search_fields = ("name_en", "name_az", "slug", "external_id")
    prepopulated_fields = {"slug": ("name_en",)}
    inlines = (SubCategoryInline,)


@admin.register(SubCategory)
class SubCategoryAdmin(admin.ModelAdmin):
    list_display = ("name_en", "category", "slug", "external_id")
    list_filter = ("category",)
    search_fields = ("name_en", "name_az", "slug", "external_id")
    autocomplete_fields = ("category",)
    prepopulated_fields = {"slug": ("name_en",)}


class ExperienceInline(admin.TabularInline):
    model = Experience
    extra = 0


class EducationInline(admin.TabularInline):
    model = Education
    extra = 0


class SkillInline(admin.TabularInline):
    model = Skill
    extra = 0


class LanguageInline(admin.TabularInline):
    model = Language
    extra = 0


class CertificateInline(admin.TabularInline):
    model = Certificate
    extra = 0


class ServiceInline(admin.TabularInline):
    model = Service
    extra = 0


class ProjectInline(admin.TabularInline):
    model = Project
    extra = 0


class QuickNoteInline(admin.StackedInline):
    model = QuickNote
    extra = 0
    max_num = 1


class EmailChangeRequestInline(admin.StackedInline):
    model = EmailChangeRequest
    extra = 0
    max_num = 1
    can_delete = False


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "profession_sub_category",
        "is_staff",
        "is_active",
    )
    list_filter = BaseUserAdmin.list_filter + ("is_searchable",)
    search_fields = ("username", "email", "first_name", "last_name", "phone_number")
    autocomplete_fields = ("profession_sub_category",)
    filter_horizontal = ("interests", "groups", "user_permissions")
    inlines = (
        EmailChangeRequestInline,
        ExperienceInline,
        EducationInline,
        SkillInline,
        LanguageInline,
        CertificateInline,
        ServiceInline,
        ProjectInline,
        QuickNoteInline,
    )

    fieldsets = BaseUserAdmin.fieldsets + (
        (
            "Profile",
            {
                "fields": (
                    "profession_sub_category",
                    "interests",
                    "phone_number",
                    "birth_day",
                    "city",
                    "summary",
                    "avatar",
                    "avatar_compressed",
                    "cover_image",
                    "language",
                ),
            },
        ),
        (
            "Locale & visibility",
            {
                "fields": (
                    "timezone",
                    "open_to",
                ),
            },
        ),
        (
            "Privacy & notifications",
            {
                "fields": (
                    "is_searchable",
                    "show_phone_number",
                    "notify_email_general",
                    "notify_new_follower",
                    "notify_updates",
                ),
            },
        ),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        (
            "Profile",
            {
                "classes": ("wide",),
                "fields": ("profession_sub_category", "phone_number", "city"),
            },
        ),
    )


@admin.register(VerificationCode)
class VerificationCodeAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "code", "is_used", "created_at")
    list_filter = ("is_used", "created_at")
    search_fields = ("user__username", "user__email", "code")
    autocomplete_fields = ("user",)
    date_hierarchy = "created_at"


@admin.register(EmailChangeRequest)
class EmailChangeRequestAdmin(admin.ModelAdmin):
    list_display = ("user", "new_email", "expires_at")
    search_fields = ("user__username", "new_email")
    autocomplete_fields = ("user",)


@admin.register(RegistrationSession)
class RegistrationSessionAdmin(admin.ModelAdmin):
    list_display = ("email", "created_at")
    search_fields = ("email",)
    readonly_fields = ("created_at",)
    date_hierarchy = "created_at"
