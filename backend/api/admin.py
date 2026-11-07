
from django.contrib import admin

from .models import (
    Equipment,
    FitnessProfile,
    WorkoutSession,
    Exercise,
    WorkoutPlan,
    WorkoutPlanExercise,
    FoodItem,
    MealEntry,
)


@admin.register(FitnessProfile)
class FitnessProfileAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'fitness_goal',
        'gym_type',
        'training_style',
        'experience_level',
        'updated_at',
    )
    list_filter = (
        'fitness_goal',
        'gym_type',
        'training_style',
        'experience_level',
        'equipment_level',
    )
    search_fields = ('user__username', 'user__email')


@admin.register(WorkoutSession)
class WorkoutSessionAdmin(admin.ModelAdmin):
    list_display = (
        'workout_title',
        'user',
        'workout_day',
        'completion_percentage',
        'workout_date',
        'updated_at',
    )
    list_filter = ('workout_day', 'completion_percentage', 'workout_date')
    search_fields = ('workout_title', 'user__username')


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'is_active', 'created_at')
    list_filter = ('category', 'is_active')
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('category', 'name')


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
        'training_style',
        'is_active',
    )
    list_filter = (
        'category',
        'muscle_group',
        'difficulty',
        'equipment',
        'training_style',
        'is_active',
    )
    search_fields = ('name', 'description', 'slug')
    autocomplete_fields = ('required_equipment',)
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('name',)


@admin.register(FoodItem)
class FoodItemAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'category',
        'calories',
        'protein_g',
        'carbohydrates_g',
        'fat_g',
        'is_vegetarian',
        'is_active',
    )
    list_filter = ('category', 'is_vegetarian', 'is_active')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('category', 'name')


@admin.register(MealEntry)
class MealEntryAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'food',
        'meal_type',
        'quantity_g',
        'meal_date',
        'created_at',
    )
    list_filter = ('meal_type', 'meal_date')
    search_fields = ('user__username', 'food__name')
    autocomplete_fields = ('food', 'user')
    date_hierarchy = 'meal_date'
