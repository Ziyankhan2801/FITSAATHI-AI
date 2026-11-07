
from django.utils.dateparse import parse_date

from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import FitnessProfile

from .models_nutrition_additions import (
    NutritionSettings,
    WaterIntake,
    SleepLog,
)

from .serializers_nutrition_additions import (
    NutritionSettingsSerializer,
    WaterIntakeSerializer,
    SleepLogSerializer,
)

from .services.nutrition_targets import calculate_targets


def apply_manual_targets(data, config):
    """
    Apply user-defined calorie and protein targets.
    Recalculate fat and carbohydrates consistently.
    """

    calories = data["calories"]
    protein = data["protein_g"]

    if config.manual_calorie_target is not None:
        calories = config.manual_calorie_target
        data["method"] = "User-set calorie target"

    if config.manual_protein_target_g is not None:
        protein = config.manual_protein_target_g

    fat = round(calories * 0.27 / 9)

    remaining_calories = (
        calories - (protein * 4) - (fat * 9)
    )

    carbohydrates = max(
        0,
        round(remaining_calories / 4)
    )

    data.update({
        "calories": calories,
        "protein_g": protein,
        "fat_g": fat,
        "carbohydrates_g": carbohydrates,
    })

    return data


def get_validated_date(request):
    """
    Validate optional YYYY-MM-DD date query parameter.
    """

    date_value = request.query_params.get("date")

    if not date_value:
        return None

    parsed_date = parse_date(date_value)

    if parsed_date is None:
        raise ValidationError({
            "date": "Enter a valid date in YYYY-MM-DD format."
        })

    return parsed_date


class NutritionTargetsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        config = NutritionSettings.objects.filter(
            user=request.user
        ).first()

        if not config:
            return Response({
                "configured": False,
                "detail": (
                    "Choose biological sex and activity level "
                    "to calculate estimates."
                ),
            })

        profile = FitnessProfile.objects.filter(
            user=request.user
        ).first()

        if not profile:
            return Response({
                "configured": False,
                "detail": "Complete your fitness profile first.",
            })

        try:
            data = calculate_targets(profile, config)

        except ValueError as exc:
            return Response({
                "configured": False,
                "detail": str(exc),
            })

        data = apply_manual_targets(data, config)
        data["settings"] = NutritionSettingsSerializer(config).data

        return Response(data)

    def post(self, request):

        obj = NutritionSettings.objects.filter(
            user=request.user
        ).first()

        serializer = NutritionSettingsSerializer(
            obj,
            data=request.data,
        )

        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def patch(self, request):

        obj = NutritionSettings.objects.filter(
            user=request.user
        ).first()

        if obj is None:
            return Response({
                "detail": (
                    "Create nutrition settings first using POST."
                ),
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = NutritionSettingsSerializer(
            obj,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)


class WaterIntakeListCreateView(generics.ListCreateAPIView):

    serializer_class = WaterIntakeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        queryset = WaterIntake.objects.filter(
            user=self.request.user
        )

        date = get_validated_date(self.request)

        if date:
            queryset = queryset.filter(
                intake_date=date
            )

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WaterIntakeDetailView(generics.DestroyAPIView):

    serializer_class = WaterIntakeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return WaterIntake.objects.filter(
            user=self.request.user
        )


class SleepLogListCreateView(generics.ListCreateAPIView):

    serializer_class = SleepLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        queryset = SleepLog.objects.filter(
            user=self.request.user
        )

        date = get_validated_date(self.request)

        if date:
            queryset = queryset.filter(
                sleep_date=date
            )

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SleepLogDetailView(generics.DestroyAPIView):

    serializer_class = SleepLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return SleepLog.objects.filter(
            user=self.request.user
        )
