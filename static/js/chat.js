/* ==========================================
   CHAT FUNCTIONALITY - webchat/static/js/chat.js
   ========================================== */

// Global variables
let socket = null;
let currentRoomId = null;
let currentUsername = null;
let chattingWith = "";
let chattingWithUserId = null;
let messagesCache = {};
let selectedFile = null;

/**
 * Initialize chat
 */
function initializeChat(username) {
    currentUsername = username;
    loadUnreadCounts();
    
    // Refresh unread counts every 10 seconds
    setInterval(loadUnreadCounts, 10000);
}

/**
 * Load unread message counts
 */
function loadUnreadCounts() {
    fetch('/chat/unread-count/', {
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(res => res.json())
    .then(data => {
        const counts = data.unread_counts;
        for (const userId in counts) {
            updateUnreadBadge(userId, counts[userId]);
        }
    })
    .catch(err => console.error('Error loading unread counts:', err));
}

/**
 * Update unread badge for a user
 */
function updateUnreadBadge(userId, count) {
    const userItem = document.querySelector(`#user-${userId} .unread-badge`);
    if (userItem) {
        if (count > 0) {
            userItem.textContent = count;
            userItem.style.display = 'block';
        } else {
            userItem.style.display = 'none';
        }
    }
}

/**
 * Open chat with a user
 */
function openChat(userId, username) {
    chattingWith = username;
    chattingWithUserId = userId;
    
    // Clear unread badge
    updateUnreadBadge(userId, 0);
    
    fetch(`/chat/start/${userId}/`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(res => res.json())
    .then(data => {
        currentRoomId = data.room_id;
        loadChatUI();
        connectSocket(currentRoomId);
        loadPreviousMessages();
    })
    .catch(err => {
        console.error('Error starting chat:', err);
        showNotification('Failed to start chat', 'error');
    });
}

/**
 * Load chat UI
 */
function loadChatUI() {
    const chatArea = document.getElementById('chatArea');
    chatArea.innerHTML = `
        <!-- Chat Header -->
        <div class="chat-header d-flex align-items-center">
            <div class="user-avatar me-3">
                ${chattingWith.slice(0, 1).toUpperCase()}
            </div>
            <div>
                <div class="fw-bold">${escapeHtml(chattingWith)}</div>
                <small class="text-success">
                    <i class="bi bi-circle-fill" style="font-size: 8px;"></i> Online
                </small>
            </div>
        </div>

        <!-- Messages -->
        <div class="messages-container" id="messagesContainer">
            <div class="text-center text-muted my-3">
                <div class="spinner-border spinner-border-sm" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <small class="d-block mt-2">Loading messages...</small>
            </div>
        </div>

        <!-- Input -->
        <div class="chat-input-container">
            <!-- File Preview -->
            <div class="file-upload-preview" id="filePreview">
                <img id="previewImage" src="" alt="Preview" style="display: none;">
                <div class="file-info" id="fileInfo">
                    <div class="fw-bold" id="fileName"></div>
                    <small class="text-muted" id="fileSize"></small>
                </div>
                <button class="btn-remove" onclick="clearFileSelection()" type="button">
                    <i class="bi bi-x"></i>
                </button>
            </div>
            
            <div class="d-flex align-items-center gap-2">
                <button class="btn btn-outline-secondary" onclick="document.getElementById('fileInput').click()" title="Attach file" type="button">
                    <i class="bi bi-paperclip"></i>
                </button>
                <input type="file" id="fileInput" class="d-none" onchange="handleFileSelect(event)" accept="image/*,video/*,.pdf,.doc,.docx,.txt">
                <input type="text" 
                       id="messageInput" 
                       class="form-control chat-input flex-grow-1" 
                       placeholder="Type a message..."
                       autocomplete="off">
                <button class="btn btn-send" onclick="sendMessage()" title="Send message" type="button">
                    <i class="bi bi-send-fill text-white"></i>
                </button>
            </div>
        </div>
    `;

    // Enter to send
    document.getElementById('messageInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

/**
 * Load previous messages
 */
function loadPreviousMessages() {
    fetch(`/chat/room/${currentRoomId}/`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(res => res.json())
    .then(data => {
        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.innerHTML = '';
        
        if (data.messages.length === 0) {
            messagesContainer.innerHTML = `
                <div class="text-center text-muted my-5">
                    <i class="bi bi-chat-dots" style="font-size: 50px; opacity: 0.3;"></i>
                    <p class="mt-3">No messages yet. Start the conversation!</p>
                </div>
            `;
        } else {
            data.messages.forEach(msg => {
                messagesCache[msg.id] = msg;
                displayMessage(
                    msg.text, 
                    msg.sender, 
                    new Date(msg.timestamp.replace(' ', 'T')), 
                    msg.read, 
                    msg.id, 
                    msg.message_type, 
                    msg.media, 
                    false
                );
            });
        }
        
        scrollToBottom();
    })
    .catch(err => {
        console.error('Error loading messages:', err);
        document.getElementById('messagesContainer').innerHTML = `
            <div class="text-center text-danger my-3">
                <i class="bi bi-exclamation-triangle"></i>
                <p>Error loading messages</p>
            </div>
        `;
    });
}

/**
 * Connect WebSocket
 */
function connectSocket(roomId) {
    if (socket) {
        socket.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    socket = new WebSocket(`${protocol}//${window.location.host}/ws/chat/${roomId}/`);

    socket.onopen = function() {
        console.log('WebSocket connected');
        socket.send(JSON.stringify({
            type: 'read_receipt'
        }));
    };

    socket.onmessage = function(e) {
        const data = JSON.parse(e.data);
        
        if (data.type === 'message') {
            messagesCache[data.message_id] = data;
            displayMessage(
                data.message, 
                data.sender, 
                new Date(data.timestamp.replace(' ', 'T')), 
                data.read, 
                data.message_id, 
                data.message_type,
                data.media,
                true
            );
            
            if (data.sender !== currentUsername) {
                setTimeout(() => {
                    socket.send(JSON.stringify({
                        type: 'read_receipt'
                    }));
                }, 500);
            }
        } else if (data.type === 'read_receipt') {
            updateAllMessagesToRead();
        }
    };

    socket.onerror = function(e) {
        console.error('WebSocket error:', e);
        showNotification('Connection error', 'error');
    };

    socket.onclose = function(e) {
        console.log('WebSocket closed');
    };
}

/**
 * Send text message
 */
function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    // If there's a file, upload it
    if (selectedFile) {
        uploadFile(message);
        return;
    }
    
    // Otherwise send text message via WebSocket
    if (message && socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'message',
            message: message
        }));
        input.value = '';
        input.focus();
    }
}

/**
 * Handle file selection
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    selectedFile = file;
    const preview = document.getElementById('filePreview');
    const previewImage = document.getElementById('previewImage');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');

    preview.classList.add('active');
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);

    // Show image preview if it's an image
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImage.src = e.target.result;
            previewImage.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        previewImage.style.display = 'none';
    }
}

/**
 * Clear file selection
 */
function clearFileSelection() {
    selectedFile = null;
    document.getElementById('fileInput').value = '';
    document.getElementById('filePreview').classList.remove('active');
}

/**
 * Upload file with message
 */
function uploadFile(message) {
    const formData = new FormData();
    formData.append('media', selectedFile);
    if (message) {
        formData.append('message', message);
    }

    const csrfToken = getCookie('csrftoken');
    const input = document.getElementById('messageInput');
    const originalPlaceholder = input.placeholder;
    
    input.placeholder = 'Uploading...';
    input.disabled = true;

    fetch(`/chat/room/${currentRoomId}/send/`, {
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': csrfToken
        },
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Notify via WebSocket
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: 'media_uploaded',
                    message_id: data.message.id,
                    message: data.message.text,
                    sender: data.message.sender,
                    timestamp: data.message.timestamp,
                    read: data.message.read,
                    message_type: data.message.message_type,
                    media: data.message.media
                }));
            }
            
            clearFileSelection();
            document.getElementById('messageInput').value = '';
            showNotification('File uploaded successfully', 'success');
        }
    })
    .catch(err => {
        console.error('Error uploading file:', err);
        showNotification('Failed to upload file', 'error');
    })
    .finally(() => {
        input.placeholder = originalPlaceholder;
        input.disabled = false;
        input.focus();
    });
}

/**
 * Display a message in the chat
 */
function displayMessage(text, sender, timestamp, isRead, messageId, messageType, mediaUrl, animate = true) {
    const container = document.getElementById('messagesContainer');
    const isSent = sender === currentUsername;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
    messageDiv.setAttribute('data-message-id', messageId);
    if (animate) {
        messageDiv.style.animation = 'messageSlide 0.3s ease';
    }
    
    let html = '';
    if (!isSent) {
        html += `<div class="message-sender">${escapeHtml(sender)}</div>`;
    }
    
    // Display media if present
    if (mediaUrl) {
        html += '<div class="message-media">';
        if (messageType === 'image') {
            html += `<img src="${mediaUrl}" alt="Image" onclick="window.open('${mediaUrl}', '_blank')">`;
        } else if (messageType === 'video') {
            html += `<video controls><source src="${mediaUrl}"></video>`;
        } else {
            const fileName = mediaUrl.split('/').pop();
            html += `
                <div class="file-preview">
                    <i class="bi bi-file-earmark" style="font-size: 30px;"></i>
                    <div class="flex-grow-1">
                        <div class="fw-bold">${escapeHtml(fileName)}</div>
                        <a href="${mediaUrl}" download class="text-white">
                            <i class="bi bi-download"></i> Download
                        </a>
                    </div>
                </div>
            `;
        }
        html += '</div>';
    }
    
    // Display text if present
    if (text) {
        html += `<div>${escapeHtml(text)}</div>`;
    }
    
    html += `<div class="message-time">
        ${formatTime(timestamp)}
        ${isSent ? getReadStatus(isRead) : ''}
    </div>`;
    
    messageDiv.innerHTML = html;
    container.appendChild(messageDiv);
    scrollToBottom();
}

/**
 * Get read status HTML
 */
function getReadStatus(isRead) {
    if (isRead) {
        return `<span class="message-status read" title="Read">
            <i class="bi bi-check-all"></i>
        </span>`;
    } else {
        return `<span class="message-status unread" title="Delivered">
            <i class="bi bi-check-all"></i>
        </span>`;
    }
}

/**
 * Update all messages to read status
 */
function updateAllMessagesToRead() {
    const sentMessages = document.querySelectorAll('.message.sent .message-status');
    sentMessages.forEach(status => {
        status.className = 'message-status read';
        status.title = 'Read';
    });
}