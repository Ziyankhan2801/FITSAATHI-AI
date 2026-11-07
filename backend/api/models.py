import os
import uuid

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models, transaction
from django.utils import timezone

from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from .storage import PrivateMediaStorage


from .models_nutrition_additions import (
    NutritionSettings,
    WaterIntake,
    SleepLog
)


class FitnessProfile(models.Model):
    class FitnessGoal(models.TextChoices):
        WEIGHT_LOSS = 'weight_loss', 'Weight loss'
        MUSCLE_GAIN = 'muscle_gain', 'Muscle gain'
        GENERAL_FITNESS = 'general_fitness', 'General fitness'
        STAMINA = 'stamina', 'Improve stamina'
        FLEXIBILITY = 'flexibility', 'Improve flexibility'

    class ExperienceLevel(models.TextChoices):
        BEGINNER = 'beginner', 'Beginner'
        INTERMEDIATE = 'intermediate', 'Intermediate'
        ADVANCED = 'advanced', 'Advanced'

    class EquipmentLevel(models.TextChoices):
        NONE = 'none', 'No equipment'
        BASIC = 'basic', 'Basic equipment'
        HOME_GYM = 'home_gym', 'Home gym'

    class GymType(models.TextChoices):
        HOME = 'home', 'Home workout'
        COMMERCIAL = 'commercial', 'Commercial gym'
        HOME_GYM = 'home_gym', 'Home gym'
        CROSSFIT = 'crossfit', 'CrossFit / Functional gym'
        POWERLIFTING = 'powerlifting', 'Powerlifting gym'
        CALISTHENICS = 'calisthenics', 'Calisthenics park'
        FITNESS_STUDIO = 'fitness_studio', 'Fitness studio'
        OUTDOOR = 'outdoor', 'Outdoor training'
        HOTEL = 'hotel', 'Hotel gym'

    class TrainingStyle(models.TextChoices):
        BODYBUILDING = 'bodybuilding', 'Bodybuilding / Hypertrophy'
        STRENGTH = 'strength', 'Strength training'
        POWERLIFTING = 'powerlifting', 'Powerlifting'
        OLYMPIC_WEIGHTLIFTING = 'olympic_weightlifting', 'Olympic weightlifting'
        FUNCTIONAL = 'functional', 'Functional training'
        CROSSFIT = 'crossfit', 'CrossFit'
        HIIT = 'hiit', 'HIIT'
        CARDIO = 'cardio', 'Cardio / Endurance'
        CALISTHENICS = 'calisthenics', 'Calisthenics'
        YOGA = 'yoga', 'Yoga'
        PILATES = 'pilates', 'Pilates'
        MOBILITY = 'mobility', 'Mobility / Flexibility'
        SPORTS = 'sports', 'Sports conditioning'

    class DietaryPreference(models.TextChoices):
        VEGETARIAN = 'vegetarian', 'Vegetarian'
        VEGAN = 'vegan', 'Vegan'
        EGGETARIAN = 'eggetarian', 'Eggetarian'
        NON_VEGETARIAN = 'non_vegetarian', 'Non-vegetarian'
        NO_PREFERENCE = 'no_preference', 'No preference'

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='fitness_profile',
    )
    date_of_birth = models.DateField(null=True, blank=True)
    height_cm = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(50), MaxValueValidator(260)],
    )
    weight_kg = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(10), MaxValueValidator(500)],
    )
    fitness_goal = models.CharField(
        max_length=30,
        choices=FitnessGoal.choices,
        blank=True,
    )
    experience_level = models.CharField(
        max_length=20,
        choices=ExperienceLevel.choices,
        blank=True,
    )
    workout_days_per_week = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(7)],
    )

    workout_weekdays = models.JSONField(
        default=list,
        blank=True,
        help_text='Selected workout weekdays: 0=Monday through 6=Sunday.',
    )


    workout_minutes = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(5), MaxValueValidator(180)],
    )
    equipment_level = models.CharField(
        max_length=20,
        choices=EquipmentLevel.choices,
        blank=True,
    )
    gym_type = models.CharField(
        max_length=30,
        choices=GymType.choices,
        blank=True,
        default='',
    )
    training_style = models.CharField(
        max_length=30,
        choices=TrainingStyle.choices,
        blank=True,
        default='',
    )
    dietary_preference = models.CharField(
        max_length=20,
        choices=DietaryPreference.choices,
        blank=True,
    )
    sleep_hours = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(24)],
    )
    has_health_limitation = models.BooleanField(null=True, blank=True)
    safety_notes = models.TextField(
        blank=True,
        help_text='Optional safety information provided voluntarily by the user.',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    available_equipment = models.ManyToManyField(
        'Equipment',
        blank=True,
        related_name='fitness_profiles',
    )

    class Meta:
        ordering = ['-updated_at']
        verbose_name = 'Fitness profile'
        verbose_name_plural = 'Fitness profiles'

    def __str__(self):
        return f'Fitness profile for user {self.user_id}'


class WorkoutSession(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='workout_sessions',
    )
    workout_day = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(3)],
    )
    workout_title = models.CharField(max_length=150)
    completed_exercises = models.JSONField(default=list, blank=True)
    total_exercises = models.PositiveSmallIntegerField(default=0)
    completion_percentage = models.PositiveSmallIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    started_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    workout_date = models.DateField(null=True, blank=True, db_index=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return (
            f'{self.workout_title} - '
            f'User {self.user_id} - Day {self.workout_day}'
        )


class WorkoutHistory(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='workout_history',
    )
    workout_day = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(3)],
    )
    workout_title = models.CharField(max_length=150)
    completed_exercises = models.JSONField(default=list)
    total_exercises = models.PositiveSmallIntegerField(default=0)
    completion_percentage = models.PositiveSmallIntegerField(
        default=100,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    workout_date = models.DateField(db_index=True)
    completed_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-completed_at']
        verbose_name = 'Workout history'
        verbose_name_plural = 'Workout history'
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'workout_day', 'workout_date'],
                name='unique_user_workout_day_date',
            ),
        ]

    def __str__(self):
        return (
            f'{self.workout_title} - '
            f'User {self.user_id} - {self.workout_date}'
        )


class BodyMeasurement(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='body_measurements',
    )
    measurement_date = models.DateField(
        default=timezone.localdate,
        db_index=True,
    )
    weight_kg = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(10), MaxValueValidator(500)],
    )
    waist_cm = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(300)],
    )
    chest_cm = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(300)],
    )
    hips_cm = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(300)],
    )
    left_arm_cm = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(300)],
    )
    right_arm_cm = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(300)],
    )
    left_thigh_cm = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(300)],
    )
    right_thigh_cm = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(300)],
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-measurement_date', '-created_at']
        verbose_name = 'Body measurement'
        verbose_name_plural = 'Body measurements'
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'measurement_date'],
                name='unique_user_measurement_date',
            ),
        ]

    def __str__(self):
        return (
            f'Body measurement - User {self.user_id} - '
            f'{self.measurement_date}'
        )



class PrivacyConsent(models.Model):

    class ConsentType(models.TextChoices):
        AI_PROFILE_CONTEXT = (
    'ai_profile_context',
    'Personal fitness profile sharing with AI',
)
        PHOTO_STORAGE = 'photo_storage', 'Progress photo storage'
        AI_ANALYSIS = 'ai_analysis', 'AI photo analysis'
        AI_CHAT = 'ai_chat', 'AI fitness chat processing'
        user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='privacy_consents',
    )

    consent_type = models.CharField(
        max_length=30,
        choices=ConsentType.choices,
    )

    is_granted = models.BooleanField(default=False)

    granted_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    withdrawn_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['consent_type']
        verbose_name = 'Privacy consent'
        verbose_name_plural = 'Privacy consents'
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'consent_type'],
                name='unique_user_consent_type',
            ),
        ]

    def __str__(self):
        return (
            f'{self.consent_type} - '
            f'User {self.user_id} - '
            f'{"Granted" if self.is_granted else "Not granted"}'
        )




def progress_photo_upload_path(instance, filename):
    """
    Generate a unique private storage path for each progress photo.
    """
    extension = os.path.splitext(filename)[1].lower()
    unique_filename = f'{uuid.uuid4().hex}{extension}'

    return (
        f'progress_photos/user_{instance.user_id}/'
        f'{unique_filename}'
    )


class ProgressPhoto(models.Model):

    class PhotoAngle(models.TextChoices):
        FRONT = 'front', 'Front'
        SIDE = 'side', 'Side'
        BACK = 'back', 'Back'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='progress_photos',
    )

    image = models.FileField(
        upload_to=progress_photo_upload_path,
        storage=PrivateMediaStorage(),
    )

    photo_angle = models.CharField(
        max_length=10,
        choices=PhotoAngle.choices,
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ['-uploaded_at']
        verbose_name = 'Progress photo'
        verbose_name_plural = 'Progress photos'

    def __str__(self):
        return (
            f'{self.photo_angle} photo - '
            f'User {self.user_id} - '
            f'{self.uploaded_at}'
        )




@receiver(pre_save, sender=ProgressPhoto)
def store_old_progress_photo(sender, instance, **kwargs):
    """
    Remember the previous image before replacing it.
    """
    if not instance.pk:
        instance._old_image_name = None
        return

    try:
        old_instance = ProgressPhoto.objects.get(pk=instance.pk)
        instance._old_image_name = old_instance.image.name
    except ProgressPhoto.DoesNotExist:
        instance._old_image_name = None


@receiver(post_save, sender=ProgressPhoto)
def delete_replaced_progress_photo(sender, instance, **kwargs):
    """
    Delete the previous image after the database transaction commits.
    """
    old_image_name = getattr(instance, '_old_image_name', None)
    new_image_name = instance.image.name

    if old_image_name and old_image_name != new_image_name:
        storage = instance.image.storage

        transaction.on_commit(
            lambda name=old_image_name, store=storage: (
                store.delete(name) if store.exists(name) else None
            )
        )


@receiver(post_delete, sender=ProgressPhoto)
def delete_progress_photo_file(sender, instance, **kwargs):
    """
    Delete the private image after its database record is deleted.
    Also handles deletion through cascading user deletion.
    """
    image_name = instance.image.name

    if image_name:
        storage = instance.image.storage

        transaction.on_commit(
            lambda name=image_name, store=storage: (
                store.delete(name) if store.exists(name) else None
            )
        )




class Equipment(models.Model):
    class Category(models.TextChoices):
        BODYWEIGHT = 'bodyweight', 'Bodyweight / No equipment'
        FREE_WEIGHTS = 'free_weights', 'Free weights'
        MACHINES = 'machines', 'Gym machines'
        CABLES = 'cables', 'Cable equipment'
        CARDIO = 'cardio', 'Cardio equipment'
        ACCESSORIES = 'accessories', 'Accessories'

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    category = models.CharField(max_length=20, choices=Category.choices)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['category', 'name']
        verbose_name = 'Equipment'
        verbose_name_plural = 'Equipment catalog'

    def __str__(self):
        return self.name


class Exercise(models.Model):
    class Category(models.TextChoices):
        STRENGTH = 'strength', 'Strength'
        CARDIO = 'cardio', 'Cardio'
        FLEXIBILITY = 'flexibility', 'Flexibility'
        MOBILITY = 'mobility', 'Mobility'
        BALANCE = 'balance', 'Balance'

    class MuscleGroup(models.TextChoices):
        CHEST = 'chest', 'Chest'
        BACK = 'back', 'Back'
        SHOULDERS = 'shoulders', 'Shoulders'
        ARMS = 'arms', 'Arms'
        CORE = 'core', 'Core'
        LEGS = 'legs', 'Legs'
        FULL_BODY = 'full_body', 'Full body'

    class Difficulty(models.TextChoices):
        BEGINNER = 'beginner', 'Beginner'
        INTERMEDIATE = 'intermediate', 'Intermediate'
        ADVANCED = 'advanced', 'Advanced'

    class Equipment(models.TextChoices):
        NONE = 'none', 'No equipment'
        DUMBBELL = 'dumbbell', 'Dumbbell'
        RESISTANCE_BAND = 'resistance_band', 'Resistance band'
        CHAIR = 'chair', 'Chair'
        MAT = 'mat', 'Exercise mat'
        OTHER = 'other', 'Other'

    name = models.CharField(max_length=150, unique=True)
    slug = models.SlugField(max_length=170, unique=True)

    description = models.TextField()
    instructions = models.JSONField(default=list)

    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        db_index=True,
    )

    muscle_group = models.CharField(
        max_length=20,
        choices=MuscleGroup.choices,
        db_index=True,
    )

    difficulty = models.CharField(
        max_length=20,
        choices=Difficulty.choices,
        default=Difficulty.BEGINNER,
        db_index=True,
    )

    equipment = models.CharField(
        max_length=30,
        choices=Equipment.choices,
        default=Equipment.NONE,
    )
    required_equipment = models.ManyToManyField(
        'Equipment',
        blank=True,
        related_name='exercises',
    )
    training_style = models.CharField(
        max_length=30,
        choices=FitnessProfile.TrainingStyle.choices,
        blank=True,
        default='',
        db_index=True,
    )

    sets = models.PositiveSmallIntegerField(default=2)
    reps = models.CharField(max_length=50, default='10 reps')
    rest_seconds = models.PositiveSmallIntegerField(default=60)

    image_url = models.URLField(blank=True)
    video_url = models.URLField(blank=True)
    safety_tips = models.TextField(blank=True)

    is_active = models.BooleanField(default=True, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Exercise'
        verbose_name_plural = 'Exercises'

    def __str__(self):
        return self.name



class WorkoutPlan(models.Model):
    class WorkoutDay(models.IntegerChoices):
        DAY_1 = 1, 'Day 1'
        DAY_2 = 2, 'Day 2'
        DAY_3 = 3, 'Day 3'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='custom_workout_plans',
    )

    workout_day = models.PositiveSmallIntegerField(
        choices=WorkoutDay.choices,
        validators=[MinValueValidator(1), MaxValueValidator(3)],
    )

    title = models.CharField(max_length=150)
    focus = models.CharField(max_length=150, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['workout_day']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'workout_day'],
                name='unique_user_custom_workout_day',
            ),
        ]

    def __str__(self):
        return f'{self.title} - User {self.user_id}'


class WorkoutPlanExercise(models.Model):
    workout_plan = models.ForeignKey(
        WorkoutPlan,
        on_delete=models.CASCADE,
        related_name='planned_exercises',
    )

    exercise = models.ForeignKey(
        Exercise,
        on_delete=models.PROTECT,
        related_name='workout_plan_entries',
    )

    sets = models.PositiveSmallIntegerField(
        default=2,
        validators=[MinValueValidator(1), MaxValueValidator(20)],
    )

    reps = models.CharField(max_length=50, default='10 reps')

    rest_seconds = models.PositiveSmallIntegerField(
        default=60,
        validators=[MaxValueValidator(600)],
    )

    order = models.PositiveSmallIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'id']
        constraints = [
            models.UniqueConstraint(
                fields=['workout_plan', 'exercise'],
                name='unique_exercise_in_workout_plan',
            ),
        ]

    def __str__(self):
        return f'{self.exercise.name} - {self.workout_plan.title}'


class AIConversation(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ai_conversations',
    )
    title = models.CharField(max_length=150, default='New conversation')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f'{self.title} - User {self.user_id}'


class AIMessage(models.Model):
    class Role(models.TextChoices):
        USER = 'user', 'User'
        ASSISTANT = 'assistant', 'Assistant'

    conversation = models.ForeignKey(
        AIConversation,
        on_delete=models.CASCADE,
        related_name='messages',
    )
    role = models.CharField(max_length=10, choices=Role.choices)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at', 'id']
        indexes = [
            models.Index(
                fields=['conversation', 'created_at'],
                name='ai_msg_conv_created_idx',
            ),
        ]

    def __str__(self):
        return f'{self.role} message - Conversation {self.conversation_id}'


class FoodItem(models.Model):
    class FoodCategory(models.TextChoices):
        GRAINS = 'grains', 'Grains & Cereals'
        DAIRY = 'dairy', 'Dairy'
        FRUITS = 'fruits', 'Fruits'
        VEGETABLES = 'vegetables', 'Vegetables'
        PROTEIN = 'protein', 'Protein Sources'
        NUTS = 'nuts', 'Nuts & Seeds'
        LEGUMES = 'legumes', 'Pulses & Legumes'
        BEVERAGES = 'beverages', 'Beverages'
        OTHER = 'other', 'Other'

    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=170, unique=True)
    category = models.CharField(
        max_length=20,
        choices=FoodCategory.choices,
        default=FoodCategory.OTHER,
        db_index=True,
    )

    serving_size_g = models.DecimalField(
        max_digits=7,
        decimal_places=2,
        default=100,
    )
    calories = models.DecimalField(max_digits=8, decimal_places=2)
    protein_g = models.DecimalField(max_digits=7, decimal_places=2, default=0)
    carbohydrates_g = models.DecimalField(max_digits=7, decimal_places=2, default=0)
    fat_g = models.DecimalField(max_digits=7, decimal_places=2, default=0)
    fiber_g = models.DecimalField(max_digits=7, decimal_places=2, default=0)

    is_vegetarian = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Food item'
        verbose_name_plural = 'Food items'

    def __str__(self):
        return self.name


class MealEntry(models.Model):
    class MealType(models.TextChoices):
        BREAKFAST = 'breakfast', 'Breakfast'
        LUNCH = 'lunch', 'Lunch'
        DINNER = 'dinner', 'Dinner'
        SNACK = 'snack', 'Snack'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='meal_entries',
    )
    food = models.ForeignKey(
        FoodItem,
        on_delete=models.PROTECT,
        related_name='meal_entries',
    )
    meal_type = models.CharField(
        max_length=15,
        choices=MealType.choices,
        db_index=True,
    )
    quantity_g = models.DecimalField(
        max_digits=7,
        decimal_places=2,
        validators=[MinValueValidator(1), MaxValueValidator(10000)],
    )
    meal_date = models.DateField(default=timezone.localdate, db_index=True)
    notes = models.CharField(max_length=250, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-meal_date', '-created_at']
        verbose_name = 'Meal entry'
        verbose_name_plural = 'Meal entries'

    def __str__(self):
        return f'{self.food.name} - User {self.user_id} - {self.meal_date}'
