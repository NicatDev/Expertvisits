from django.urls import path

from apps.chat.api import views

urlpatterns = [
    path("search-users/", views.UserSearchListView.as_view(), name="chat-search-users"),
    path("rooms/", views.ChatRoomListView.as_view(), name="chat-room-list"),
    path("rooms/create-or-get/", views.CreateOrGetChatView.as_view(), name="chat-room-create-or-get"),
    path("rooms/<int:chat_id>/messages/", views.ChatMessageListView.as_view(), name="chat-messages"),
    path("rooms/<int:chat_id>/read/", views.MarkMessagesReadView.as_view(), name="chat-messages-read"),
]
