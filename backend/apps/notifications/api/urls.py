from django.urls import path

from apps.notifications.api import views

urlpatterns = [
    path("summary/", views.InboxSummaryView.as_view(), name="inbox-summary"),
    path("inbox/", views.InboxListView.as_view(), name="inbox-list"),
    path("inbox/mark-all-read/", views.InboxMarkAllReadView.as_view(), name="inbox-mark-all-read"),
    path("inbox/read/", views.InboxMarkReadView.as_view(), name="inbox-mark-read"),
]
