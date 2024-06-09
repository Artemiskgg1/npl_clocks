from django.urls import path
from . import views

urlpatterns = [
    path('sync/', views.sync_ntd, name='sync_ntd'),
]
