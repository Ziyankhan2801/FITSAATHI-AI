
import logging

from django.conf import settings
from django.contrib.auth import get_user_model, logout
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.core.serializers.json import DjangoJSONEncoder
from django.db import transaction
from django.http import JsonResponse
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.views.decorators.cache import never_cache

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from django.forms.models import model_to_dict

from .models import (
    FitnessProfile,
    WorkoutSession,
    WorkoutHistory,
    BodyMeasurement,
    PrivacyConsent,
    ProgressPhoto,
    WorkoutPlan,
    WorkoutPlanExercise,
    AIConversation,
    AIMessage,
    MealEntry,
)
from .models_nutrition_additions import (
    NutritionSettings,
    WaterIntake,
    SleepLog,
)

User = get_user_model()
logger = logging.getLogger(__name__)


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'password_reset'

    def post(self, request):
        email = str(request.data.get('email', '')).strip().lower()

        generic_message = (
            'If an account exists with this email, '
            'a password reset link will be sent.'
        )

        if not email or len(email) > 254:
            return Response(
                {'message': generic_message},
                status=status.HTTP_200_OK,
            )

        user = User.objects.filter(
            email__iexact=email,
            is_active=True,
        ).first()

        if user and user.email:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)

            frontend_url = getattr(
                settings,
                'FRONTEND_BASE_URL',
                'http://localhost:5173',
            ).rstrip('/')

            reset_url = (
                f'{frontend_url}/reset-password/'
                f'?uid={uid}&token={token}'
            )

            try:
                send_mail(
                    subject='Reset your FitSaathi AI password',
                    message=(
                        'We received a request to reset your password.\n\n'
                        f'Open this link to continue:\n{reset_url}\n\n'
                        'If you did not request this, ignore this email.'
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception:
                logger.exception('Password reset email could not be sent.')

        return Response(
            {'message': generic_message},
            status=status.HTTP_200_OK,
        )


class ResetPasswordConfirmView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'password_reset_confirm'

    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        password = request.data.get('password')
        password_confirm = request.data.get('password_confirm')

        if not all([uid, token, password, password_confirm]):
            return Response(
                {'message': 'All fields are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if password != password_confirm:
            return Response(
                {'message': 'Passwords do not match.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id, is_active=True)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {'message': 'This reset link is invalid or expired.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                {'message': 'This reset link is invalid or expired.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(password, user=user)
        except ValidationError as error:
            return Response(
                {'message': ' '.join(error.messages)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(password)
        user.save(update_fields=['password'])

        return Response(
            {'message': 'Password reset successfully. Please log in.'},
            status=status.HTTP_200_OK,
        )


def export_queryset(queryset):
    return [
        model_to_dict(instance)
        for instance in queryset
    ]


class ExportMyDataView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        profile = FitnessProfile.objects.filter(user=user).first()
        profile_data = model_to_dict(profile) if profile else None

        if profile_data is not None:
            profile_data['available_equipment'] = list(
                profile.available_equipment.values_list('id', flat=True)
            )

        plans = WorkoutPlan.objects.filter(user=user)
        plan_ids = plans.values_list('id', flat=True)

        conversations = AIConversation.objects.filter(user=user)
        conversation_ids = conversations.values_list('id', flat=True)

        export_data = {
            'export_information': {
                'application': 'FitSaathi AI',
                'format_version': 1,
                'user_id': user.pk,
                'exported_at': __import__('django.utils.timezone', fromlist=['now']).now(),
                'timezone': settings.TIME_ZONE,
                'included_note': (
                    'Progress photo metadata is included. '
                    'Private photo image files are not included.'
                ),
            },
            'account': {
                'id': user.pk,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'date_joined': user.date_joined,
                'last_login': user.last_login,
            },
            'fitness_profile': profile_data,
            'workout_sessions': export_queryset(
                WorkoutSession.objects.filter(user=user)
            ),
            'workout_history': export_queryset(
                WorkoutHistory.objects.filter(user=user)
            ),
            'body_measurements': export_queryset(
                BodyMeasurement.objects.filter(user=user)
            ),
            'privacy_consents': export_queryset(
                PrivacyConsent.objects.filter(user=user)
            ),
            'progress_photos': list(
                ProgressPhoto.objects.filter(user=user).values(
                    'id', 'photo_angle', 'uploaded_at'
                )
            ),
            'workout_plans': export_queryset(plans),
            'workout_plan_exercises': export_queryset(
                WorkoutPlanExercise.objects.filter(
                    workout_plan_id__in=plan_ids
                )
            ),
            'ai_conversations': export_queryset(conversations),
            'ai_messages': export_queryset(
                AIMessage.objects.filter(
                    conversation_id__in=conversation_ids
                )
            ),
            'nutrition_settings': (
                model_to_dict(
                    NutritionSettings.objects.filter(user=user).first()
                )
                if NutritionSettings.objects.filter(user=user).exists()
                else None
            ),
            'meal_entries': export_queryset(
                MealEntry.objects.filter(user=user)
            ),
            'water_intakes': export_queryset(
                WaterIntake.objects.filter(user=user)
            ),
            'sleep_logs': export_queryset(
                SleepLog.objects.filter(user=user)
            ),
        }

        response = JsonResponse(
            export_data,
            encoder=DjangoJSONEncoder,
            json_dumps_params={'indent': 2},
        )
        response['Content-Disposition'] = (
            'attachment; filename="fitsaathi-my-data.json"'
        )
        response['Cache-Control'] = 'private, no-store'
        response['X-Content-Type-Options'] = 'nosniff'

        return response


class DeleteMyAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        password = request.data.get('password', '')

        if not isinstance(password, str) or not password:
            return Response(
                {'message': 'Your current password is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user

        if not user.check_password(password):
            return Response(
                {'message': 'Your current password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            # End the current authenticated session.
            logout(request)

            # Django cascades deletion through user-owned records.
            # ProgressPhoto post_delete signals also remove private files.
            user.delete()

        return Response(
            {'message': 'Your account has been permanently deleted.'},
            status=status.HTTP_200_OK,
        )
