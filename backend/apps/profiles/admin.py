from django.contrib import admin

from .models import Certificate, Education, Experience, Language, Project, QuickNote, Service, Skill


@admin.register(Experience)
class ExperienceAdmin(admin.ModelAdmin):
    list_display = ("user", "position", "company_name", "start_date", "end_date")
    list_filter = ("start_date",)
    search_fields = ("user__username", "position", "company_name")
    autocomplete_fields = ("user",)
    date_hierarchy = "start_date"


@admin.register(Education)
class EducationAdmin(admin.ModelAdmin):
    list_display = ("user", "degree_type", "institution", "field_of_study", "start_date")
    list_filter = ("degree_type",)
    search_fields = ("user__username", "institution", "field_of_study")
    autocomplete_fields = ("user",)
    date_hierarchy = "start_date"


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ("user", "name", "skill_type")
    list_filter = ("skill_type",)
    search_fields = ("user__username", "name")
    autocomplete_fields = ("user",)


@admin.register(Language)
class LanguageAdmin(admin.ModelAdmin):
    list_display = ("user", "name", "level")
    list_filter = ("level",)
    search_fields = ("user__username", "name")
    autocomplete_fields = ("user",)


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ("user", "name", "issuing_organization", "issue_date")
    search_fields = ("user__username", "name", "issuing_organization")
    autocomplete_fields = ("user",)
    date_hierarchy = "issue_date"


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("user", "title")
    search_fields = ("user__username", "title", "description")
    autocomplete_fields = ("user",)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("user", "title", "date")
    search_fields = ("user__username", "title")
    autocomplete_fields = ("user",)
    date_hierarchy = "date"


@admin.register(QuickNote)
class QuickNoteAdmin(admin.ModelAdmin):
    list_display = ("user", "content")
    search_fields = ("user__username", "content")
    autocomplete_fields = ("user",)
