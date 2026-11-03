
from django.contrib import admin

from .models import (
    FitnessProfile,
    WorkoutSession,
    Exercise,
    WorkoutPlan,
    WorkoutPlanExercise,
)


class WorkoutPlanExerciseInline(admin.TabularInline):
    model = WorkoutPlanExercise
    extra = 1
    autocomplete_fields = ['exercise']
    fields = (
        'exercise',
        'sets',
        'reps',
        'rest_seconds',
        'order',
    )


@admin.register(WorkoutPlan)
class WorkoutPlanAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'user',
        'workout_day',
        'focus',
        'updated_at',
    )

    list_filter = ('workout_day',)
    search_fields = ('title', 'focus', 'user__username')
    inlines = [WorkoutPlanExerciseInline]


@admin.register(WorkoutPlanExercise)
class WorkoutPlanExerciseAdmin(admin.ModelAdmin):
    list_display = (
        'exercise',
        'workout_plan',
        'sets',
        'reps',
        'rest_seconds',
        'order',
    )

    list_filter = ('workout_plan__workout_day',)
    search_fields = ('exercise__name', 'workout_plan__title')


@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'category',
        'muscle_group',
        'difficulty',
        'equipment',
        'is_active',
    )

    list_filter = (
        'category',
        'muscle_group',
        'difficulty',
        'equipment',
        'is_active',
    )

    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('name',)
