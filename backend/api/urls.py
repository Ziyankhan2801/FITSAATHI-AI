
from django.urls import path

from .views import FitnessProfileView, health_check

urlpatterns = [
    path('health/', health_check, name='health-check'),
    path(
        'fitness-profile/',
        FitnessProfileView.as_view(),
        name='fitness-profile',
    ),
]
