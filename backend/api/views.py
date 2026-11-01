
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.db import transaction
from django.middleware.csrf import get_token
from django.utils import timezone

from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import (
    BodyMeasurement,
    FitnessProfile,
    PrivacyConsent,
    ProgressPhoto,
    WorkoutHistory,
    WorkoutSession,
)

from .serializers import (
    BodyMeasurementSerializer,
    FitnessProfileSerializer,
    PrivacyConsentSerializer,
    ProgressPhotoSerializer,
    RegistrationSerializer,
    WorkoutHistorySerializer,
    WorkoutSessionSerializer,
)

from rest_framework.parsers import FormParser, MultiPartParser


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
    List the authenticated user's progress photos
    and allow uploads with valid photo-storage consent.
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
    Allow users to retrieve or delete only their own photos.
    File cleanup is handled by the ProgressPhoto deletion signal.
    """

    serializer_class = ProgressPhotoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ProgressPhoto.objects.filter(
            user=self.request.user
        )
