
from datetime import date

from rest_framework import serializers

from .models import FitnessProfile


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

        today = date.today()
        birth_date = obj.date_of_birth

        return (
            today.year
            - birth_date.year
            - ((today.month, today.day) < (birth_date.month, birth_date.day))
        )

    def validate_date_of_birth(self, value):
        if value and value > date.today():
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

        # Height and weight are optional during initial profile creation.
        # If supplied, the model validators enforce reasonable ranges.
        if height is not None and weight is not None:
            if height <= 0 or weight <= 0:
                raise serializers.ValidationError(
                    'Height and weight must be greater than zero.'
                )

        return attrs
