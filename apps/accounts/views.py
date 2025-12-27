from django.shortcuts import redirect, render
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.contrib.auth.decorators import login_required

# Create your views here.

@login_required
def home(request):
    user = User.objects.all()
    return render(request, 'chat/chat_layout.html', {'users': user})

def user_login(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return redirect('home')
        else:
                messages.error(request, 'Invalid username or password')
    return render(request, 'accounts/login.html')

def register_user(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        User.objects.create_user(username=username, password=password)
        return redirect('login')
    return render(request, 'accounts/register.html')

def user_logout(request):
    logout(request)
    return redirect('login')

@login_required
def search_user(request):
    query = request.GET.get('query')
    user = User.objects.filter(username__icontains = query)
    return render(request, 'accounts/accounts.html', {'users': user})