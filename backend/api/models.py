import os
import uuid

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models, transaction
from django.utils import timezone

from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from .storage import PrivateMediaStorage


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
        PHOTO_STORAGE = 'photo_storage', 'Progress photo storage'
        AI_ANALYSIS = 'ai_analysis', 'AI photo analysis'

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
