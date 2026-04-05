from django.contrib import admin

from .models import (
    Company,
    CompanyNews,
    CompanyRegistrationPending,
    CompanyService,
    OngoingProject,
    OurValues,
    ProjectInternalPost,
    ProjectRequest,
    Vacancy,
    VacancyApplication,
    WhatWeDo,
    WhoWeAre,
)


class CompanyNewsInline(admin.TabularInline):
    model = CompanyNews
    extra = 0


class CompanyServiceInline(admin.TabularInline):
    model = CompanyService
    extra = 0


class WhoWeAreInline(admin.StackedInline):
    model = WhoWeAre
    max_num = 1
    can_delete = True


class WhatWeDoInline(admin.StackedInline):
    model = WhatWeDo
    max_num = 1
    can_delete = True


class OurValuesInline(admin.StackedInline):
    model = OurValues
    max_num = 1
    can_delete = True


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "owner", "email", "founded_at")
    search_fields = ("name", "slug", "email", "owner__username")
    prepopulated_fields = {"slug": ("name",)}
    autocomplete_fields = ("owner",)
    inlines = (
        WhoWeAreInline,
        WhatWeDoInline,
        OurValuesInline,
        CompanyNewsInline,
        CompanyServiceInline,
    )


@admin.register(CompanyRegistrationPending)
class CompanyRegistrationPendingAdmin(admin.ModelAdmin):
    list_display = ("user", "email", "name", "expires_at", "created_at")
    list_filter = ("created_at",)
    search_fields = ("email", "name", "user__username")
    autocomplete_fields = ("user",)
    date_hierarchy = "created_at"


@admin.register(CompanyNews)
class CompanyNewsAdmin(admin.ModelAdmin):
    list_display = ("company", "title", "created_at")
    search_fields = ("title", "company__name")
    autocomplete_fields = ("company",)
    date_hierarchy = "created_at"


@admin.register(Vacancy)
class VacancyAdmin(admin.ModelAdmin):
    list_display = ("title", "posted_as", "company", "posted_by", "posted_at", "expires_at")
    list_filter = ("posted_as", "listing_type", "job_type", "work_mode", "language")
    search_fields = ("title", "slug", "employer_display_name")
    autocomplete_fields = ("company", "posted_by", "sub_category")
    prepopulated_fields = {"slug": ("title",)}
    date_hierarchy = "posted_at"


@admin.register(VacancyApplication)
class VacancyApplicationAdmin(admin.ModelAdmin):
    list_display = ("vacancy", "applicant", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("vacancy__title", "applicant__username")
    autocomplete_fields = ("vacancy", "applicant")
    date_hierarchy = "created_at"


@admin.register(OngoingProject)
class OngoingProjectAdmin(admin.ModelAdmin):
    list_display = ("title", "creator", "is_active")
    list_filter = ("is_active",)
    search_fields = ("title", "creator__username")
    autocomplete_fields = ("creator",)
    filter_horizontal = ("participants",)


@admin.register(ProjectInternalPost)
class ProjectInternalPostAdmin(admin.ModelAdmin):
    list_display = ("project", "created_at")
    list_filter = ("created_at",)
    search_fields = ("project__title", "description")
    autocomplete_fields = ("project",)
    date_hierarchy = "created_at"


@admin.register(ProjectRequest)
class ProjectRequestAdmin(admin.ModelAdmin):
    list_display = ("project", "user")
    search_fields = ("project__title", "user__username", "message")
    autocomplete_fields = ("project", "user")


# Standalone admins for one-to-one sections (also editable via Company inlines)
@admin.register(WhoWeAre)
class WhoWeAreAdmin(admin.ModelAdmin):
    list_display = ("company", "title")
    search_fields = ("title", "company__name")
    autocomplete_fields = ("company",)


@admin.register(WhatWeDo)
class WhatWeDoAdmin(admin.ModelAdmin):
    list_display = ("company", "title")
    search_fields = ("title", "company__name")
    autocomplete_fields = ("company",)


@admin.register(OurValues)
class OurValuesAdmin(admin.ModelAdmin):
    list_display = ("company", "title")
    search_fields = ("title", "company__name")
    autocomplete_fields = ("company",)


@admin.register(CompanyService)
class CompanyServiceAdmin(admin.ModelAdmin):
    list_display = ("company", "title", "created_at")
    search_fields = ("title", "company__name")
    autocomplete_fields = ("company",)
    date_hierarchy = "created_at"
