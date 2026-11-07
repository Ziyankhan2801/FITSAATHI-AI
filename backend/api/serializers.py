
import os
import warnings

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
    Exercise,
    Equipment,
    FoodItem,
    MealEntry,
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
    available_equipment = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Equipment.objects.filter(is_active=True),
        required=False,
    )

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
            'workout_weekdays',
            'workout_minutes',
            'equipment_level',
            'gym_type',
            'training_style',
            'available_equipment',
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

    def validate_workout_weekdays(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError(
                'Workout weekdays must be provided as a list.'
            )

        if any(type(day) is not int or day < 0 or day > 6 for day in value):
            raise serializers.ValidationError(
                'Each workout weekday must be an integer from 0 to 6.'
            )

        if len(value) != len(set(value)):
            raise serializers.ValidationError(
                'Duplicate workout weekdays are not allowed.'
            )

        if len(value) > 7:
            raise serializers.ValidationError(
                'You cannot select more than 7 workout weekdays.'
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
            'completed_at',
            'workout_date',
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

    def validate(self, attrs):
        # A consent category is fixed once its record has been created.
        if self.instance is not None:
            requested_type = self.initial_data.get('consent_type')

            if (
                requested_type is not None
                and requested_type != self.instance.consent_type
            ):
                raise serializers.ValidationError({
                    'consent_type': (
                        'Consent type cannot be changed after creation.'
                    )
                })

        return attrs

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
    Accepts validated progress-photo uploads without exposing private paths.
    """

    image = serializers.ImageField(write_only=True)

    MAX_IMAGE_SIZE = 5 * 1024 * 1024
    MAX_IMAGE_WIDTH = 4096
    MAX_IMAGE_HEIGHT = 4096
    MAX_IMAGE_PIXELS = 16_000_000

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

            with warnings.catch_warnings():
                warnings.simplefilter(
                    'error',
                    Image.DecompressionBombWarning,
                )

                with Image.open(value) as uploaded_image:
                    image_format = uploaded_image.format
                    width, height = uploaded_image.size

                    if image_format not in self.ALLOWED_FORMATS:
                        raise serializers.ValidationError(
                            'Invalid image format.'
                        )

                    if width > self.MAX_IMAGE_WIDTH:
                        raise serializers.ValidationError(
                            'Image width cannot exceed 4096 pixels.'
                        )

                    if height > self.MAX_IMAGE_HEIGHT:
                        raise serializers.ValidationError(
                            'Image height cannot exceed 4096 pixels.'
                        )

                    if width * height > self.MAX_IMAGE_PIXELS:
                        raise serializers.ValidationError(
                            'Image cannot exceed 16 million pixels.'
                        )

                    uploaded_image.verify()

            value.seek(0)

        except (
            UnidentifiedImageError,
            Image.DecompressionBombError,
            Image.DecompressionBombWarning,
            OSError,
            SyntaxError,
        ):
            raise serializers.ValidationError(
                'Invalid, corrupted or unsafe image.'
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




class EquipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = [
            'id',
            'name',
            'slug',
            'category',
            'description',
            'is_active',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class ExerciseSerializer(serializers.ModelSerializer):
    required_equipment = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Equipment.objects.filter(is_active=True),
        required=False,
    )

    class Meta:
        model = Exercise
        fields = [
            'id',
            'name',
            'slug',
            'description',
            'instructions',
            'category',
            'muscle_group',
            'difficulty',
            'equipment',
            'required_equipment',
            'training_style',
            'sets',
            'reps',
            'rest_seconds',
            'image_url',
            'video_url',
            'safety_tips',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
            'is_active',
        ]


from .models import WorkoutPlan, WorkoutPlanExercise


class WorkoutPlanExerciseSerializer(serializers.ModelSerializer):
    exercise_name = serializers.CharField(
        source='exercise.name',
        read_only=True,
    )

    class Meta:
        model = WorkoutPlanExercise
        fields = [
            'id',
            'exercise',
            'exercise_name',
            'sets',
            'reps',
            'rest_seconds',
            'order',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class WorkoutPlanSerializer(serializers.ModelSerializer):
    planned_exercises = WorkoutPlanExerciseSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = WorkoutPlan
        fields = [
            'id',
            'workout_day',
            'title',
            'focus',
            'planned_exercises',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']



from .models import AIConversation, AIMessage


class AIMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIMessage
        fields = ["id", "role", "content", "created_at"]
        read_only_fields = fields


class AIConversationSerializer(serializers.ModelSerializer):
    messages = AIMessageSerializer(many=True, read_only=True)

    class Meta:
        model = AIConversation
        fields = ["id", "title", "messages", "created_at", "updated_at"]
        read_only_fields = fields




class FoodItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodItem
        fields = [
            'id',
            'name',
            'slug',
            'category',
            'serving_size_g',
            'calories',
            'protein_g',
            'carbohydrates_g',
            'fat_g',
            'fiber_g',
            'is_vegetarian',
        ]
        read_only_fields = ['id']


class MealEntrySerializer(serializers.ModelSerializer):
    food = serializers.PrimaryKeyRelatedField(
        queryset=FoodItem.objects.filter(is_active=True),
    )

    food_name = serializers.CharField(
        source='food.name',
        read_only=True,
    )
    food_nutrition = serializers.SerializerMethodField()

    class Meta:
        model = MealEntry
        fields = [
            'id',
            'food',
            'food_name',
            'food_nutrition',
            'meal_type',
            'quantity_g',
            'meal_date',
            'notes',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'food_name',
            'food_nutrition',
            'created_at',
        ]

    def get_food_nutrition(self, obj):
        food = obj.food
        quantity = float(obj.quantity_g)
        serving_size = float(food.serving_size_g)

        multiplier = quantity / serving_size

        return {
            'calories': round(float(food.calories) * multiplier, 2),
            'protein_g': round(float(food.protein_g) * multiplier, 2),
            'carbohydrates_g': round(
                float(food.carbohydrates_g) * multiplier, 2
            ),
            'fat_g': round(float(food.fat_g) * multiplier, 2),
            'fiber_g': round(float(food.fiber_g) * multiplier, 2),
        }

    def validate_meal_date(self, value):
        if value > timezone.localdate():
            raise serializers.ValidationError(
                'Meal date cannot be in the future.'
            )
        return value

    def validate(self, attrs):
        request = self.context.get('request')

        if request is None or not request.user.is_authenticated:
            raise serializers.ValidationError(
                'Authentication is required to log meals.'
            )

        return attrs
