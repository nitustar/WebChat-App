from django.http.response import JsonResponse
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from .models import ChatRoom, Message
from django.core.serializers import serialize
import json

@login_required
def start_chat(request, user_id):
    other_user = User.objects.get(id=user_id)

    room = ChatRoom.objects.filter(
        participants=request.user
    ).filter(
        participants=other_user
    ).first()

    if not room:
        room = ChatRoom.objects.create()
        room.participants.add(request.user, other_user)

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({"room_id": room.id})
    
    return redirect('chat_room', room_id=room.id)


@login_required
def chat_room(request, room_id):
    room = ChatRoom.objects.get(id=room_id)
    if request.user not in room.participants.all():
        return redirect('home')
    
    messages = Message.objects.filter(room=room).order_by('timestamp')

    # If AJAX request, return JSON
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        messages_data = []
        for msg in messages:
            messages_data.append({
                'id': msg.id,
                'sender': msg.sender.username,
                'text': msg.text,
                'timestamp': msg.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                'read': msg.read,
                'message_type': msg.message_type,
                'media': msg.media.url if msg.media else None,
            })
        return JsonResponse({'messages': messages_data})

    return render(request, 'chat/chat_room.html', {
        'room': room,
        'messages': messages
    })


@login_required
def send_message(request, room_id):
    if request.method == 'POST':
        room = ChatRoom.objects.get(id=room_id)
        
        text = request.POST.get('message', '').strip()
        media_file = request.FILES.get('media')
        
        # Determine message type
        message_type = 'text'
        if media_file:
            file_name = media_file.name.lower()
            if file_name.endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                message_type = 'image'
            elif file_name.endswith(('.mp4', '.mov', '.avi', '.webm')):
                message_type = 'video'
            else:
                message_type = 'file'

        msg = Message.objects.create(
            room=room,
            sender=request.user,
            text=text,
            media=media_file,
            message_type=message_type
        )

        # If AJAX request, return JSON
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'success': True,
                'message': {
                    'id': msg.id,
                    'sender': msg.sender.username,
                    'text': msg.text,
                    'timestamp': msg.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                    'read': msg.read,
                    'message_type': msg.message_type,
                    'media': msg.media.url if msg.media else None,
                }
            })

    return redirect('chat_room', room_id=room_id)


@login_required
def get_unread_count(request):
    """Get unread message count for each chat room"""
    rooms = ChatRoom.objects.filter(participants=request.user)
    unread_counts = {}
    
    for room in rooms:
        count = Message.objects.filter(
            room=room,
            read=False
        ).exclude(sender=request.user).count()
        
        if count > 0:
            other_user = room.participants.exclude(id=request.user.id).first()
            if other_user:
                unread_counts[other_user.id] = count
    
    return JsonResponse({'unread_counts': unread_counts})