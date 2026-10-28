
from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


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

    date_of_birth = models.DateField(
        null=True,
        blank=True,
    )

    height_cm = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[
            MinValueValidator(50),
            MaxValueValidator(260),
        ],
    )

    weight_kg = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[
            MinValueValidator(10),
            MaxValueValidator(500),
        ],
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
        validators=[
            MinValueValidator(1),
            MaxValueValidator(7),
        ],
    )

    workout_minutes = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[
            MinValueValidator(5),
            MaxValueValidator(180),
        ],
    )

    equipment_level = models.CharField(
        max_length=20,
        choices=EquipmentLevel.choices,
        blank=True,
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
        validators=[
            MinValueValidator(0),
            MaxValueValidator(24),
        ],
    )

    has_health_limitation = models.BooleanField(
        null=True,
        blank=True,
    )

    safety_notes = models.TextField(
        blank=True,
        help_text='Optional safety information provided voluntarily by the user.',
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        verbose_name = 'Fitness profile'
        verbose_name_plural = 'Fitness profiles'

    def __str__(self):
        return f'Fitness profile for user {self.user_id}'
