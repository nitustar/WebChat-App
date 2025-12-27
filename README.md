# 💬 WebChat - Real-time Chat Application

A modern, real-time chat application built with Django and WebSockets. Features include instant messaging, read receipts, media sharing, and a sleek dark-themed UI.

![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)
![Django](https://img.shields.io/badge/Django-6.0+-green.svg)
![Channels](https://img.shields.io/badge/Channels-WebSocket-orange.svg)

## ✨ Features

- 🚀 **Real-time Messaging** - Instant message delivery using WebSockets
- ✅ **Read Receipts** - WhatsApp-style read indicators (✓✓)
- 📎 **Media Sharing** - Send images, videos, and files
- 💬 **Persistent Chat History** - Messages saved to database
- 🔔 **Unread Message Badges** - Track new messages per conversation
- 🎨 **Modern Dark UI** - Sleek, responsive design
- 🔐 **User Authentication** - Secure login and registration

## 🛠️ Tech Stack

- **Backend:** Django 6.0, Django Channels
- **WebSocket:** Channels (InMemoryChannelLayer for dev)
- **Database:** SQLite (default)
- **Frontend:** Bootstrap 5, Vanilla JavaScript
- **Icons:** Bootstrap Icons

## 📦 Installation

### Prerequisites

```bash
Python 3.10+
pip
```

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/webchat.git
cd webchat
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install django channels daphne
```

4. **Run migrations**
```bash
python manage.py makemigrations
python manage.py migrate
```

5. **Create superuser (optional)**
```bash
python manage.py createsuperuser
```

6. **Run the development server**
```bash
python manage.py runserver
```

7. **Access the app**
```
http://localhost:8000
```

## 🚀 Usage

1. **Register** a new account or login
2. **Search** for users in the search bar
3. **Click** on a user to start chatting
4. **Send** text messages or attach media files
5. **See** read receipts when messages are read

## 📁 Project Structure

```
webchat/
├── apps/
│   ├── accounts/        # User authentication
│   └── chat/            # Chat functionality
│       ├── models.py    # ChatRoom, Message models
│       ├── views.py     # Chat views
│       ├── consumers.py # WebSocket consumer
│       └── routing.py   # WebSocket routing
├── static/
│   ├── css/             # Stylesheets
│   └── js/              # JavaScript files
├── templates/           # HTML templates
├── media/               # User uploaded files
└── webchat/
    ├── settings.py      # Django settings
    ├── urls.py          # URL configuration
    └── asgi.py          # ASGI configuration
```

## 🔧 Configuration

### For Production

1. **Install Redis** (for production WebSocket layer)
```bash
pip install channels-redis
```

2. **Update `settings.py`**
```python
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [("127.0.0.1", 6379)],
        },
    },
}
```

3. **Set environment variables**
```bash
DEBUG=False
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=yourdomain.com
```

## 📸 Screenshots

```
[Login Page]
<img width="1877" height="916" alt="image" src="https://github.com/user-attachments/assets/cf8ba153-a2cd-4b25-bea6-27c87c76e07c" />
[Chat Interface]
<img width="1869" height="903" alt="image" src="https://github.com/user-attachments/assets/edddd8c5-9293-4f48-8c09-5e80bafa4788" />
<img width="1876" height="935" alt="image" src="https://github.com/user-attachments/assets/0b6e960c-7459-4d84-9779-c47e0121c747" />


```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 👤 Author

**Your Name**
- GitHub: [@nitustar](https://github.com/nitustar)

## 🙏 Acknowledgments

- Django & Django Channels documentation
- Bootstrap for the UI framework
- Bootstrap Icons for the icon set

---

⭐ **Star this repo if you find it helpful!**
