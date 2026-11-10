
from .views_nutrition_additions import (
    NutritionTargetsView,
    WaterIntakeListCreateView,
    WaterIntakeDetailView,
    SleepLogListCreateView,
    SleepLogDetailView,
)

from .views_account import (
    ForgotPasswordView,
    ResetPasswordConfirmView,
    ExportMyDataView,
    DeleteMyAccountView,
)


from django.urls import path

from .views import (
    EquipmentListView,
    FoodItemListView,
    MealEntryListCreateView,
    MealEntryDetailView,
    NutritionSummaryView,
    AIConversationListCreateView,
    AIConversationDetailView,
    AIChatMessageView,
    WorkoutPlanListCreateView,
    WorkoutPlanDetailView,
    WorkoutPlanExerciseCreateView,
    WorkoutPlanExerciseDetailView,
    GenerateWorkoutView,
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
    path(
    'workout-plans/generate/',
    GenerateWorkoutView.as_view(),
    name='generate-workout',
),
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
    path('equipment/', EquipmentListView.as_view(), name='equipment-list',),
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

# AI Fitness Coach
path(
    'ai/conversations/',
    AIConversationListCreateView.as_view(),
    name='ai-conversation-list-create',
),
path(
    'ai/conversations/<int:pk>/',
    AIConversationDetailView.as_view(),
    name='ai-conversation-detail',
),
path(
    'ai/conversations/<int:conversation_id>/messages/',
    AIChatMessageView.as_view(),
    name='ai-chat-message',
),

    # Nutrition Coach
    path(
        'nutrition/foods/',
        FoodItemListView.as_view(),
        name='nutrition-food-list',
    ),
    path(
        'nutrition/meals/',
        MealEntryListCreateView.as_view(),
        name='nutrition-meal-list-create',
    ),
    path(
        'nutrition/meals/<int:pk>/',
        MealEntryDetailView.as_view(),
        name='nutrition-meal-detail',
    ),
    path(
        'nutrition/summary/',
        NutritionSummaryView.as_view(),
        name='nutrition-summary',
    ),

# Nutrition Targets
path(
    'nutrition/targets/',
    NutritionTargetsView.as_view(),
    name='nutrition-targets',
),

# Water Tracking
path(
    'nutrition/water/',
    WaterIntakeListCreateView.as_view(),
    name='nutrition-water-list-create',
),

path(
    'nutrition/water/<int:pk>/',
    WaterIntakeDetailView.as_view(),
    name='nutrition-water-detail',
),

# Sleep Tracking
path(
    'nutrition/sleep/',
    SleepLogListCreateView.as_view(),
    name='nutrition-sleep-list-create',
),

path(
    'nutrition/sleep/<int:pk>/',
    SleepLogDetailView.as_view(),
    name='nutrition-sleep-detail',
),


path(
    'password-reset/',
    ForgotPasswordView.as_view(),
    name='password-reset',
),
path(
    'password-reset/confirm/',
    ResetPasswordConfirmView.as_view(),
    name='password-reset-confirm',
),
path(
    'account/export/',
    ExportMyDataView.as_view(),
    name='account-export',
),
path(
    'account/delete/',
    DeleteMyAccountView.as_view(),
    name='account-delete',
),


]
