from django.urls import path

from apps.connections.api import views

urlpatterns = [
    path("requests/<int:pk>/accept/", views.AcceptConnectionView.as_view(), name="connection-accept"),
    path("requests/<int:pk>/decline/", views.DeclineConnectionView.as_view(), name="connection-decline"),
    path("requests/<int:pk>/cancel/", views.CancelOutgoingConnectionView.as_view(), name="connection-cancel"),
]
