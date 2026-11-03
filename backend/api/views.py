from rest_framework import generics, filters
from rest_framework.permissions import IsAuthenticated

from .models import Exercise
from .serializers import ExerciseSerializer

import mimetypes

from django.contrib.auth import authenticate, get_user_model, login, logout
from django.db import transaction
from django.http import FileResponse, Http404
from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import (
    BodyMeasurement,
    FitnessProfile,
    PrivacyConsent,
    ProgressPhoto,
    WorkoutHistory,
    WorkoutSession,
    WorkoutPlan,
    WorkoutPlanExercise,
)

from .serializers import (
    BodyMeasurementSerializer,
    FitnessProfileSerializer,
    PrivacyConsentSerializer,
    ProgressPhotoSerializer,
    RegistrationSerializer,
    WorkoutHistorySerializer,
    WorkoutSessionSerializer,
    WorkoutPlanSerializer,
    WorkoutPlanExerciseSerializer,
)


User = get_user_model()


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({
        'status': 'success',
        'message': 'FitSaathi AI backend is running.',
        'service': 'FitSaathi AI API',
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def csrf_token_view(request):
    return Response({'csrfToken': get_token(request)})


class RegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegistrationSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            {
                'status': 'success',
                'message': 'Account created successfully.',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                },
            },
            status=status.HTTP_201_CREATED,
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')

    if not username or not password:
        return Response(
            {'detail': 'Username and password are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(
        request,
        username=username,
        password=password,
    )

    if user is None:
        return Response(
            {'detail': 'Invalid username or password.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    login(request, user)

    return Response({
        'status': 'success',
        'message': 'Login successful.',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
        },
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_user_view(request):
    return Response({
        'id': request.user.id,
        'username': request.user.username,
        'email': request.user.email,
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response({
        'status': 'success',
        'message': 'Logout successful.',
    })


class FitnessProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = FitnessProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, _ = FitnessProfile.objects.get_or_create(
            user=self.request.user
        )
        return profile


def record_workout_completion(session):
    """Create one history record per user, workout day, and date."""
    if session.completion_percentage != 100:
        return

    if not session.completed_exercises or session.total_exercises <= 0:
        return

    workout_date = session.workout_date or timezone.localdate()

    WorkoutHistory.objects.get_or_create(
        user=session.user,
        workout_day=session.workout_day,
        workout_date=workout_date,
        defaults={
            'workout_title': session.workout_title,
            'completed_exercises': list(session.completed_exercises),
            'total_exercises': session.total_exercises,
            'completion_percentage': session.completion_percentage,
            'completed_at': session.completed_at or timezone.now(),
        },
    )


class WorkoutSessionListCreateView(generics.ListCreateAPIView):
    serializer_class = WorkoutSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkoutSession.objects.filter(
            user=self.request.user
        )

    @transaction.atomic
    def perform_create(self, serializer):
        session = serializer.save(user=self.request.user)
        record_workout_completion(session)


class WorkoutSessionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = WorkoutSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkoutSession.objects.filter(
            user=self.request.user
        )

    @transaction.atomic
    def perform_update(self, serializer):
        was_completed = (
            serializer.instance.completion_percentage == 100
        )

        session = serializer.save()
        is_completed = session.completion_percentage == 100

        if is_completed and not was_completed:
            record_workout_completion(session)


class WorkoutHistoryListView(generics.ListAPIView):
    serializer_class = WorkoutHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkoutHistory.objects.filter(
            user=self.request.user
        ).order_by('-completed_at')


class BodyMeasurementListCreateView(generics.ListCreateAPIView):
    serializer_class = BodyMeasurementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return BodyMeasurement.objects.filter(
            user=self.request.user
        ).order_by('-measurement_date', '-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class BodyMeasurementDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BodyMeasurementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return BodyMeasurement.objects.filter(
            user=self.request.user
        )


class PrivacyConsentListCreateView(generics.ListCreateAPIView):
    serializer_class = PrivacyConsentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PrivacyConsent.objects.filter(
            user=self.request.user
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PrivacyConsentDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = PrivacyConsentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PrivacyConsent.objects.filter(
            user=self.request.user
        )

    @transaction.atomic
    def perform_update(self, serializer):
        consent = serializer.instance
        was_granted = consent.is_granted

        updated_consent = serializer.save()

        should_delete_photos = (
            updated_consent.consent_type
            == PrivacyConsent.ConsentType.PHOTO_STORAGE
            and was_granted
            and not updated_consent.is_granted
        )

        if should_delete_photos:
            ProgressPhoto.objects.filter(
                user=self.request.user
            ).delete()


class ProgressPhotoListCreateView(generics.ListCreateAPIView):
    """
    List the authenticated user's progress photos and allow consented uploads.
    """

    serializer_class = ProgressPhotoSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return ProgressPhoto.objects.filter(
            user=self.request.user
        ).order_by('-uploaded_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ProgressPhotoDetailView(generics.RetrieveDestroyAPIView):
    """
    Allow users to retrieve or delete only their own photo metadata.
    """

    serializer_class = ProgressPhotoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ProgressPhoto.objects.filter(
            user=self.request.user
        )


class ProgressPhotoImageView(generics.GenericAPIView):
    """
    Stream a private progress photo to its authenticated owner.
    """

    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'head', 'options']

    def get(self, request, pk):
        photo = get_object_or_404(
            ProgressPhoto.objects.filter(user=request.user),
            pk=pk,
        )

        has_consent = PrivacyConsent.objects.filter(
            user=request.user,
            consent_type=PrivacyConsent.ConsentType.PHOTO_STORAGE,
            is_granted=True,
        ).exists()

        if not has_consent:
            raise Http404('Photo is not available.')

        try:
            image_file = photo.image.open('rb')
        except (FileNotFoundError, OSError, ValueError):
            raise Http404('Photo file is not available.')

        content_type, _ = mimetypes.guess_type(photo.image.name)

        if content_type not in {
            'image/jpeg',
            'image/png',
            'image/webp',
        }:
            image_file.close()
            raise Http404('Unsupported image format.')

        response = FileResponse(
            image_file,
            content_type=content_type,
        )

        response['Cache-Control'] = 'private, no-store, max-age=0'
        response['Pragma'] = 'no-cache'
        response['X-Content-Type-Options'] = 'nosniff'
        response['Content-Disposition'] = 'inline'

        return response


class ExerciseListView(generics.ListAPIView):
    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]

    search_fields = ['name', 'description', 'muscle_group']
    ordering_fields = ['name', 'difficulty', 'category']
    ordering = ['name']

    def get_queryset(self):
        queryset = Exercise.objects.filter(is_active=True)

        category = self.request.query_params.get('category')
        muscle_group = self.request.query_params.get('muscle_group')
        difficulty = self.request.query_params.get('difficulty')
        equipment = self.request.query_params.get('equipment')

        if category:
            queryset = queryset.filter(category=category)

        if muscle_group:
            queryset = queryset.filter(muscle_group=muscle_group)

        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)

        if equipment:
            queryset = queryset.filter(equipment=equipment)

        return queryset


class ExerciseDetailView(generics.RetrieveAPIView):
    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Exercise.objects.filter(is_active=True)



class WorkoutPlanListCreateView(generics.ListCreateAPIView):
    serializer_class = WorkoutPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkoutPlan.objects.filter(
            user=self.request.user
        ).prefetch_related('planned_exercises__exercise')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WorkoutPlanDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = WorkoutPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkoutPlan.objects.filter(
            user=self.request.user
        ).prefetch_related('planned_exercises__exercise')


class WorkoutPlanExerciseCreateView(generics.CreateAPIView):
    serializer_class = WorkoutPlanExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        workout_plan = get_object_or_404(
            WorkoutPlan,
            pk=self.kwargs['plan_id'],
            user=self.request.user,
        )

        exercise = serializer.validated_data['exercise']

        if not exercise.is_active:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({
                'exercise': 'This exercise is currently unavailable.'
            })

        if WorkoutPlanExercise.objects.filter(
            workout_plan=workout_plan,
            exercise=exercise,
        ).exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError({
                'exercise': 'This exercise is already in this workout plan.'
            })

        serializer.save(workout_plan=workout_plan)


class WorkoutPlanExerciseDetailView(generics.DestroyAPIView):
    serializer_class = WorkoutPlanExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkoutPlanExercise.objects.filter(
            workout_plan__user=self.request.user
        )
