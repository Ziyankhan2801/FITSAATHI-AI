from django.utils import timezone
from rest_framework import serializers

from .models_nutrition_additions import (
    NutritionSettings,
    WaterIntake,
    SleepLog
)


class NutritionSettingsSerializer(serializers.ModelSerializer):

    class Meta:
        model = NutritionSettings

        fields = [
            "biological_sex",
            "activity_level",
            "manual_calorie_target",
            "manual_protein_target_g",
            "updated_at"
        ]

        read_only_fields = ["updated_at"]


class WaterIntakeSerializer(serializers.ModelSerializer):

    class Meta:
        model = WaterIntake

        fields = [
            "id",
            "intake_date",
            "amount_ml",
            "created_at"
        ]

        read_only_fields = [
            "id",
            "created_at"
        ]

    def validate_intake_date(self, value):

        if value > timezone.localdate():
            raise serializers.ValidationError(
                "Future dates are not allowed."
            )

        return value


class SleepLogSerializer(serializers.ModelSerializer):

    class Meta:
        model = SleepLog

        fields = [
            "id",
            "sleep_date",
            "duration_minutes",
            "quality",
            "notes",
            "created_at"
        ]

        read_only_fields = [
            "id",
            "created_at"
        ]

    def validate_sleep_date(self, value):

        if value > timezone.localdate():
            raise serializers.ValidationError(
                "Future dates are not allowed."
            )

        return value