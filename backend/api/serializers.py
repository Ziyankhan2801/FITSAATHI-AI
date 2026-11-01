
import os
from PIL import Image, UnidentifiedImageError

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers


from .models import (
    BodyMeasurement,
    FitnessProfile,
    PrivacyConsent,
    ProgressPhoto,
    WorkoutHistory,
    WorkoutSession,
)


User = get_user_model()


class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'},
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
    )

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'password',
            'password_confirm',
        ]
        read_only_fields = ['id']

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError(
                'This username is already taken.'
            )
        return value

    def validate_email(self, value):
        value = value.strip().lower()

        if not value:
            raise serializers.ValidationError(
                'Email address is required.'
            )

        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                'An account with this email already exists.'
            )

        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Passwords do not match.'
            })

        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        return user


class FitnessProfileSerializer(serializers.ModelSerializer):
    age = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = FitnessProfile
        fields = [
            'id',
            'date_of_birth',
            'age',
            'height_cm',
            'weight_kg',
            'fitness_goal',
            'experience_level',
            'workout_days_per_week',
            'workout_minutes',
            'equipment_level',
            'dietary_preference',
            'sleep_hours',
            'has_health_limitation',
            'safety_notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'age', 'created_at', 'updated_at']

    def get_age(self, obj):
        if not obj.date_of_birth:
            return None

        today = timezone.localdate()
        birth_date = obj.date_of_birth

        return (
            today.year
            - birth_date.year
            - ((today.month, today.day) < (birth_date.month, birth_date.day))
        )

    def validate_date_of_birth(self, value):
        if value and value > timezone.localdate():
            raise serializers.ValidationError(
                'Date of birth cannot be in the future.'
            )

        return value

    def validate(self, attrs):
        height = attrs.get(
            'height_cm',
            getattr(self.instance, 'height_cm', None),
        )
        weight = attrs.get(
            'weight_kg',
            getattr(self.instance, 'weight_kg', None),
        )

        if height is not None and weight is not None:
            if height <= 0 or weight <= 0:
                raise serializers.ValidationError(
                    'Height and weight must be greater than zero.'
                )

        return attrs


class WorkoutSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkoutSession
        fields = [
            'id',
            'workout_day',
            'workout_title',
            'completed_exercises',
            'total_exercises',
            'completion_percentage',
            'started_at',
            'updated_at',
            'completed_at',
            'workout_date',
        ]
        read_only_fields = [
            'id',
            'started_at',
            'updated_at',
        ]

    def validate_completed_exercises(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError(
                'Completed exercises must be a list.'
            )

        if not all(isinstance(item, str) for item in value):
            raise serializers.ValidationError(
                'Each completed exercise must be a string.'
            )

        if len(value) != len(set(value)):
            raise serializers.ValidationError(
                'Duplicate completed exercises are not allowed.'
            )

        return value

    def validate(self, attrs):
        completed = attrs.get(
            'completed_exercises',
            getattr(self.instance, 'completed_exercises', []),
        )
        total = attrs.get(
            'total_exercises',
            getattr(self.instance, 'total_exercises', 0),
        )

        if total < 0:
            raise serializers.ValidationError({
                'total_exercises': 'Total exercises cannot be negative.'
            })

        if len(completed) > total:
            raise serializers.ValidationError({
                'completed_exercises':
                    'Completed exercises cannot exceed total exercises.'
            })

        expected_percentage = (
            round(len(completed) / total * 100) if total else 0
        )

        if 'completion_percentage' in attrs:
            if attrs['completion_percentage'] != expected_percentage:
                raise serializers.ValidationError({
                    'completion_percentage':
                        'Completion percentage does not match the exercise count.'
                })
        else:
            attrs['completion_percentage'] = expected_percentage

        if expected_percentage == 100 and total > 0:
            attrs['completed_at'] = (
                attrs.get('completed_at')
                or (
                    self.instance.completed_at
                    if self.instance else None
                )
            )

            if not attrs.get('workout_date') and not (
                self.instance and self.instance.workout_date
            ):
                attrs['workout_date'] = timezone.localdate()

        return attrs


class WorkoutHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkoutHistory
        fields = [
            'id',
            'workout_day',
            'workout_title',
            'completed_exercises',
            'total_exercises',
            'completion_percentage',
            'workout_date',
            'completed_at',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'workout_day',
            'workout_title',
            'completed_exercises',
            'total_exercises',
            'completion_percentage',
            'workout_date',
            'completed_at',
            'created_at',
        ]


class BodyMeasurementSerializer(serializers.ModelSerializer):
    class Meta:
        model = BodyMeasurement
        fields = [
            'id',
            'measurement_date',
            'weight_kg',
            'waist_cm',
            'chest_cm',
            'hips_cm',
            'left_arm_cm',
            'right_arm_cm',
            'left_thigh_cm',
            'right_thigh_cm',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
        ]

    def validate_measurement_date(self, value):
        if value > timezone.localdate():
            raise serializers.ValidationError(
                'Measurement date cannot be in the future.'
            )

        return value

    def validate(self, attrs):
        request = self.context.get('request')

        if request is None or not request.user.is_authenticated:
            return attrs

        measurement_date = attrs.get(
            'measurement_date',
            self.instance.measurement_date
            if self.instance
            else timezone.localdate(),
        )

        existing_measurement = BodyMeasurement.objects.filter(
            user=request.user,
            measurement_date=measurement_date,
        )

        if self.instance:
            existing_measurement = existing_measurement.exclude(
                pk=self.instance.pk
            )

        if existing_measurement.exists():
            raise serializers.ValidationError({
                'measurement_date':
                    'You already have a measurement for this date. '
                    'Update your existing entry instead.'
            })

        return attrs


class PrivacyConsentSerializer(serializers.ModelSerializer):

    class Meta:
        model = PrivacyConsent
        fields = [
            'id',
            'consent_type',
            'is_granted',
            'granted_at',
            'withdrawn_at',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'granted_at',
            'withdrawn_at',
            'created_at',
            'updated_at',
        ]

        extra_kwargs = {
            'is_granted': {
                'required': True,
            },
        }

    def create(self, validated_data):
        is_granted = validated_data.get('is_granted', False)

        if is_granted:
            validated_data['granted_at'] = timezone.now()

        return super().create(validated_data)

    def update(self, instance, validated_data):
        new_status = validated_data.get(
            'is_granted',
            instance.is_granted,
        )

        if new_status and not instance.is_granted:
            validated_data['granted_at'] = timezone.now()
            validated_data['withdrawn_at'] = None

        elif not new_status and instance.is_granted:
            validated_data['withdrawn_at'] = timezone.now()

        return super().update(instance, validated_data)

class ProgressPhotoSerializer(serializers.ModelSerializer):
    """
    Accepts an uploaded image but never exposes its private storage path
    in API responses.
    """

    image = serializers.ImageField(write_only=True)

    MAX_IMAGE_SIZE = 5 * 1024 * 1024

    ALLOWED_EXTENSIONS = {
        '.jpg',
        '.jpeg',
        '.png',
        '.webp',
    }

    ALLOWED_FORMATS = {
        'JPEG',
        'PNG',
        'WEBP',
    }

    class Meta:
        model = ProgressPhoto
        fields = [
            'id',
            'image',
            'photo_angle',
            'uploaded_at',
        ]
        read_only_fields = [
            'id',
            'uploaded_at',
        ]

    def validate_image(self, value):
        extension = os.path.splitext(value.name)[1].lower()

        if extension not in self.ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(
                'Only JPG, JPEG, PNG and WEBP images are allowed.'
            )

        if value.size == 0:
            raise serializers.ValidationError(
                'Uploaded image cannot be empty.'
            )

        if value.size > self.MAX_IMAGE_SIZE:
            raise serializers.ValidationError(
                'Image size cannot exceed 5 MB.'
            )

        try:
            value.seek(0)

            with Image.open(value) as uploaded_image:
                image_format = uploaded_image.format
                uploaded_image.verify()

            if image_format not in self.ALLOWED_FORMATS:
                raise serializers.ValidationError(
                    'Invalid image format.'
                )

            value.seek(0)

        except (UnidentifiedImageError, OSError, SyntaxError):
            raise serializers.ValidationError(
                'Uploaded file is not a valid image.'
            )

        return value

    def validate(self, attrs):
        request = self.context.get('request')

        if request is None or not request.user.is_authenticated:
            raise serializers.ValidationError(
                'Authentication is required to upload progress photos.'
            )

        has_photo_consent = PrivacyConsent.objects.filter(
            user=request.user,
            consent_type=PrivacyConsent.ConsentType.PHOTO_STORAGE,
            is_granted=True,
        ).exists()

        if not has_photo_consent:
            raise serializers.ValidationError({
                'consent': (
                    'You must grant progress photo storage consent '
                    'before uploading photos.'
                )
            })

        return attrs
