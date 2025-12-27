from django.urls import path
from .views import start_chat, chat_room, send_message, get_unread_count

urlpatterns = [
    path('start/<int:user_id>/', start_chat, name='start_chat'),
    path('room/<int:room_id>/', chat_room, name='chat_room'),
    path('room/<int:room_id>/send/', send_message, name='send_message'),
    path('unread-count/', get_unread_count, name='unread_count'),
]