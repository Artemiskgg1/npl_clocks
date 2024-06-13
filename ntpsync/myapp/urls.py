from django.urls import path
from . import views

urlpatterns = [
    path('sync/', views.start_sync, name='start_sync'),
    path('logs/', views.get_logs, name='get_logs'),
]
    