from django.urls import path
from .consumers import ChatConsumer # type: ignore

websocket_urlpatterns = [
    path("ws/chat/<int:room_id>/", ChatConsumer.as_asgi()),
]
