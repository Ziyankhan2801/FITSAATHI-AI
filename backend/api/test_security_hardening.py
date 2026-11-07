"""Regression tests for FitSaathi AI security boundaries.

Run: python manage.py test api.test_security_hardening
"""

from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import AIConversation, PrivacyConsent, WorkoutSession

User = get_user_model()


TEST_THROTTLE_SETTINGS = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'login': '5/minute',
        'register': '3/hour',
        'ai_chat': '10/minute',
        'generate_workout': '5/minute',
    },
}


@override_settings(REST_FRAMEWORK=TEST_THROTTLE_SETTINGS)
class RateLimitSecurityTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(
            username='securityuser',
            email='security@example.com',
            password='SecurePass123!',
        )

    def tearDown(self):
        cache.clear()

    def test_login_throttles_sixth_attempt(self):
        url = reverse('login')
        for _ in range(5):
            response = self.client.post(
                url,
                {'username': 'nobody', 'password': 'incorrect'},
                format='json',
            )
            self.assertNotEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

        response = self.client.post(
            url,
            {'username': 'nobody', 'password': 'incorrect'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_registration_throttles_fourth_attempt(self):
        url = reverse('register')
        for _ in range(3):
            response = self.client.post(url, {}, format='json')
            self.assertNotEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_workout_generation_throttles_sixth_attempt(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('generate-workout')
        # Avoid depending on workout catalog or fitness profile completion.
        with patch('api.views.generate_personalized_workout', return_value={'days': []}):
            for _ in range(5):
                response = self.client.post(url, {}, format='json')
                self.assertNotEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
            response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_ai_chat_throttles_eleventh_attempt_without_external_api(self):
        self.client.force_authenticate(user=self.user)
        conversation = AIConversation.objects.create(user=self.user, title='Security test')
        url = reverse('ai-chat-message', kwargs={'conversation_id': conversation.pk})
        # No AI_CHAT consent: first ten calls return 403 before any external AI call.
        for _ in range(10):
            response = self.client.post(url, {'content': 'hello'}, format='json')
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        response = self.client.post(url, {'content': 'hello'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)


class ConsentAndTimestampSecurityTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='securityowner',
            email='owner@example.com',
            password='SecurePass123!',
        )
        self.client.force_authenticate(user=self.user)

    def test_consent_type_cannot_be_changed(self):
        consent = PrivacyConsent.objects.create(
            user=self.user,
            consent_type=PrivacyConsent.ConsentType.PHOTO_STORAGE,
            is_granted=True,
        )
        url = reverse('privacy-consent-detail', kwargs={'pk': consent.pk})
        response = self.client.patch(
            url,
            {'consent_type': PrivacyConsent.ConsentType.AI_CHAT},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        consent.refresh_from_db()
        self.assertEqual(consent.consent_type, PrivacyConsent.ConsentType.PHOTO_STORAGE)

    def test_client_cannot_set_workout_completion_timestamps_on_create(self):
        forged_date = timezone.localdate() - timedelta(days=120)
        forged_time = timezone.now() - timedelta(days=120)
        response = self.client.post(
            reverse('workout-list-create'),
            {
                'workout_day': 1,
                'workout_title': 'Security workout',
                'completed_exercises': [],
                'total_exercises': 1,
                'completion_percentage': 0,
                'completed_at': forged_time.isoformat(),
                'workout_date': forged_date.isoformat(),
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        session = WorkoutSession.objects.get(pk=response.data['id'])
        self.assertIsNone(session.completed_at)
        self.assertNotEqual(session.workout_date, forged_date)

    def test_client_cannot_override_completion_timestamps_on_update(self):
        session = WorkoutSession.objects.create(
            user=self.user,
            workout_day=1,
            workout_title='Security workout',
            completed_exercises=[],
            total_exercises=1,
            completion_percentage=0,
        )
        forged_date = timezone.localdate() - timedelta(days=120)
        forged_time = timezone.now() - timedelta(days=120)
        response = self.client.patch(
            reverse('workout-detail', kwargs={'pk': session.pk}),
            {
                'completed_at': forged_time.isoformat(),
                'workout_date': forged_date.isoformat(),
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        session.refresh_from_db()
        self.assertIsNone(session.completed_at)
        self.assertNotEqual(session.workout_date, forged_date)
