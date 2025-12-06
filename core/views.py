from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth import views as auth_views
from django.views.decorators.csrf import ensure_csrf_cookie
from .models import Score
import json

def signup_view(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('player_home') # Changed from game to player_home
    else:
        form = UserCreationForm()
    return render(request, 'signup.html', {'form': form})

def login_view(request):
    if request.user.is_authenticated:
         if request.user.is_staff:
            return redirect('dashboard')
         return redirect('player_home')

    if request.method == 'POST':
        form = AuthenticationForm(data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            if user.is_staff:
                return redirect('dashboard')
            return redirect('player_home')
    else:
        form = AuthenticationForm()
    return render(request, 'login.html', {'form': form})

# Renaming home_view to player_home_view for clarity
@login_required
def player_home_view(request):
    # Get user's high score object
    user_score = Score.objects.filter(player=request.user).order_by('-score').first()
    
    context = {
        'username': request.user.username,
        'high_score': user_score.score if user_score else 0,
        'achievements': user_score.achievements if user_score else [],
        'join_date': request.user.date_joined
    }
    return render(request, 'player_home.html', context)

@ensure_csrf_cookie
def game_view(request):
    # Get high score for the UI
    high_score = 0
    if request.user.is_authenticated:
        qs = Score.objects.filter(player=request.user).order_by('-score').first()
        if qs: high_score = qs.score
    
    return render(request, 'game.html', {
        'high_score': high_score
    })

@login_required
def api_save_score(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        Score.objects.create(
            player=request.user,
            score=data.get('score', 0),
            achievements=data.get('achievements', [])
        )
        return JsonResponse({'status': 'saved'})
@login_required
def dashboard_view(request):
    scores = Score.objects.all().order_by('-score')
    return render(request, 'dashboard.html', {'scores': scores})
