from django.urls import path
from .views import home, user_login, register_user, user_logout, search_user

urlpatterns = [
    path('', home, name='home'),
    path('login/', user_login, name='login'),
    path('register/', register_user, name='register'),
    path('logout/', user_logout, name='logout'),
    path('search/', search_user, name='search'),
]