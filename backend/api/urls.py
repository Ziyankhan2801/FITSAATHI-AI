from django.urls import path

from .views import (
    WorkoutPlanListCreateView,
    WorkoutPlanDetailView,
    WorkoutPlanExerciseCreateView,
    WorkoutPlanExerciseDetailView,
    BodyMeasurementDetailView,
    BodyMeasurementListCreateView,
    FitnessProfileView,
    PrivacyConsentDetailView,
    PrivacyConsentListCreateView,
    ProgressPhotoDetailView,
    ProgressPhotoImageView,
    ProgressPhotoListCreateView,
    RegistrationView,
    WorkoutHistoryListView,
    WorkoutSessionDetailView,
    WorkoutSessionListCreateView,
    csrf_token_view,
    current_user_view,
    health_check,
    login_view,
    logout_view,
    ExerciseListView,
    ExerciseDetailView,
)


urlpatterns = [
    path('health/', health_check, name='health-check'),
    path('csrf/', csrf_token_view, name='csrf-token'),
    path('register/', RegistrationView.as_view(), name='register'),
    path('login/', login_view, name='login'),
    path('me/', current_user_view, name='current-user'),
    path('logout/', logout_view, name='logout'),

    path(
        'fitness-profile/',
        FitnessProfileView.as_view(),
        name='fitness-profile',
    ),

    path(
        'workouts/',
        WorkoutSessionListCreateView.as_view(),
        name='workout-list-create',
    ),
    path(
        'workouts/<int:pk>/',
        WorkoutSessionDetailView.as_view(),
        name='workout-detail',
    ),
    path(
        'workout-history/',
        WorkoutHistoryListView.as_view(),
        name='workout-history',
    ),

    path(
        'body-measurements/',
        BodyMeasurementListCreateView.as_view(),
        name='body-measurement-list-create',
    ),
    path(
        'body-measurements/<int:pk>/',
        BodyMeasurementDetailView.as_view(),
        name='body-measurement-detail',
    ),

    path(
        'privacy-consents/',
        PrivacyConsentListCreateView.as_view(),
        name='privacy-consent-list-create',
    ),
    path(
        'privacy-consents/<int:pk>/',
        PrivacyConsentDetailView.as_view(),
        name='privacy-consent-detail',
    ),

    path(
        'progress-photos/',
        ProgressPhotoListCreateView.as_view(),
        name='progress-photo-list-create',
    ),
    path(
        'progress-photos/<int:pk>/',
        ProgressPhotoDetailView.as_view(),
        name='progress-photo-detail',
    ),
    path(
        'progress-photos/<int:pk>/image/',
        ProgressPhotoImageView.as_view(),
        name='progress-photo-image',
    ),
    path('exercises/', ExerciseListView.as_view(), name='exercise-list'),
    path('exercises/<int:pk>/', ExerciseDetailView.as_view(), name='exercise-detail'),

    # Custom Workout Plans
path(
    'workout-plans/',
    WorkoutPlanListCreateView.as_view(),
    name='workout-plan-list-create',
),
path(
    'workout-plans/<int:pk>/',
    WorkoutPlanDetailView.as_view(),
    name='workout-plan-detail',
),
path(
    'workout-plans/<int:plan_id>/exercises/',
    WorkoutPlanExerciseCreateView.as_view(),
    name='workout-plan-exercise-create',
),
path(
    'workout-plan-exercises/<int:pk>/',
    WorkoutPlanExerciseDetailView.as_view(),
    name='workout-plan-exercise-detail',
),
]
