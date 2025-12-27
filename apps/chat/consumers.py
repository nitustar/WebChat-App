import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import ChatRoom, Message
from channels.db import database_sync_to_async

class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.room_group = f"chat_{self.room_id}"

        await self.channel_layer.group_add(
            self.room_group,
            self.channel_name
        )
        await self.accept()

        # Mark all messages as read when user joins
        await self.mark_messages_as_read()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get("type", "message")

        if message_type == "message":
            message_text = data["message"]
            msg = await self.save_message(message_text)

            await self.channel_layer.group_send(
                self.room_group,
                {
                    "type": "chat_message",
                    "message_id": msg.id,
                    "message": msg.text,
                    "sender": msg.sender.username,
                    "timestamp": msg.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                    "read": msg.read,
                    "message_type": msg.message_type,
                    "media": msg.media.url if msg.media else None,
                }
            )

        elif message_type == "read_receipt":
            # Mark messages as read
            await self.mark_messages_as_read()
            await self.channel_layer.group_send(
                self.room_group,
                {
                    "type": "read_status",
                    "reader": self.scope["user"].username,
                }
            )
        
        elif message_type == "media_uploaded":
            # Notify other users that media was uploaded
            await self.channel_layer.group_send(
                self.room_group,
                {
                    "type": "chat_message",
                    "message_id": data["message_id"],
                    "message": data["message"],
                    "sender": data["sender"],
                    "timestamp": data["timestamp"],
                    "read": data["read"],
                    "message_type": data["message_type"],
                    "media": data["media"],
                }
            )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "message",
            "message_id": event["message_id"],
            "message": event["message"],
            "sender": event["sender"],
            "timestamp": event["timestamp"],
            "read": event["read"],
            "message_type": event.get("message_type", "text"),
            "media": event.get("media"),
        }))

    async def read_status(self, event):
        await self.send(text_data=json.dumps({
            "type": "read_receipt",
            "reader": event["reader"],
        }))

    @database_sync_to_async
    def save_message(self, text):
        room = ChatRoom.objects.get(id=self.room_id)
        return Message.objects.create(
            room=room,
            sender=self.scope["user"],
            text=text,
            message_type="text"
        )

    @database_sync_to_async
    def mark_messages_as_read(self):
        """Mark all messages in this room as read (except user's own messages)"""
        room = ChatRoom.objects.get(id=self.room_id)
        Message.objects.filter(
            room=room,
            read=False
        ).exclude(
            sender=self.scope["user"]
        ).update(read=True)