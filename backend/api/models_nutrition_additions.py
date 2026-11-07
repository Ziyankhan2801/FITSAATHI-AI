from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone


class NutritionSettings(models.Model):

    class BiologicalSex(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"

    class ActivityLevel(models.TextChoices):
        SEDENTARY = "sedentary", "Sedentary"
        LIGHT = "light", "Lightly active"
        MODERATE = "moderate", "Moderately active"
        VERY = "very", "Very active"
        EXTRA = "extra", "Extremely active"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="nutrition_settings"
    )

    biological_sex = models.CharField(
        max_length=10,
        choices=BiologicalSex.choices
    )

    activity_level = models.CharField(
        max_length=12,
        choices=ActivityLevel.choices,
        default=ActivityLevel.MODERATE
    )

    manual_calorie_target = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[
            MinValueValidator(800),
            MaxValueValidator(10000)
        ]
    )

    manual_protein_target_g = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(500)
        ]
    )

    updated_at = models.DateTimeField(auto_now=True)


class WaterIntake(models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="water_intakes"
    )

    intake_date = models.DateField(
        default=timezone.localdate,
        db_index=True
    )

    amount_ml = models.PositiveIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5000)
        ]
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class SleepLog(models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sleep_logs"
    )

    sleep_date = models.DateField(
        default=timezone.localdate,
        db_index=True
    )

    duration_minutes = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(1440)
        ]
    )

    quality = models.CharField(
        max_length=12,
        choices=[
            ("poor", "Poor"),
            ("okay", "Okay"),
            ("good", "Good")
        ],
        default="okay"
    )

    notes = models.CharField(
        max_length=250,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-sleep_date", "-created_at"]