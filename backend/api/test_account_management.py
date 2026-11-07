
import re

from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.test import override_settings
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from rest_framework import status
from rest_framework.test import APITestCase

from api.models import WorkoutSession

User = get_user_model()


@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend'
)
class PasswordResetTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='resetuser',
            email='reset@example.com',
            password='OldSecurePass123!',
        )

    def test_forgot_password_sends_reset_email(self):
        response = self.client.post(
            reverse('password-reset'),
            {'email': self.user.email},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('reset-password/', mail.outbox[0].body)

    def test_forgot_password_does_not_reveal_unknown_email(self):
        response = self.client.post(
            reverse('password-reset'),
            {'email': 'unknown@example.com'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 0)

    def test_valid_token_resets_password(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)
        new_password = 'BrandNewSecurePass123!X'

        response = self.client.post(
            reverse('password-reset-confirm'),
            {
                'uid': uid,
                'token': token,
                'password': new_password,
                'password_confirm': new_password,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(new_password))
        self.assertFalse(
            default_token_generator.check_token(self.user, token)
        )

    def test_invalid_reset_token_is_rejected(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))

        response = self.client.post(
            reverse('password-reset-confirm'),
            {
                'uid': uid,
                'token': 'invalid-token',
                'password': 'BrandNewSecurePass123!X',
                'password_confirm': 'BrandNewSecurePass123!X',
            },
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_password_mismatch_is_rejected(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)

        response = self.client.post(
            reverse('password-reset-confirm'),
            {
                'uid': uid,
                'token': token,
                'password': 'BrandNewSecurePass123!X',
                'password_confirm': 'DifferentSecurePass123!X',
            },
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )


class AccountExportTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='exportuser',
            email='export@example.com',
            password='SecurePass123!',
        )

        self.other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='SecurePass123!',
        )

    def test_export_contains_only_authenticated_users_data(self):
        own_session = WorkoutSession.objects.create(
            user=self.user,
            workout_day=1,
            workout_title='My Workout',
            completed_exercises=[],
            total_exercises=2,
            completion_percentage=50,
        )

        WorkoutSession.objects.create(
            user=self.other_user,
            workout_day=1,
            workout_title='Other User Workout',
            completed_exercises=[],
            total_exercises=1,
            completion_percentage=100,
        )

        self.client.force_authenticate(user=self.user)

        response = self.client.get(reverse('account-export'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(data['account']['username'], 'exportuser')
        self.assertNotIn('password', data['account'])

        exported_titles = [
            item['workout_title']
            for item in data['workout_sessions']
        ]

        self.assertIn('My Workout', exported_titles)
        self.assertNotIn('Other User Workout', exported_titles)

        self.assertEqual(
            data['workout_sessions'][0]['id'],
            own_session.pk,
        )

        self.assertIn(
            'attachment;',
            response['Content-Disposition'],
        )

        self.assertEqual(
            response['Cache-Control'],
            'private, no-store',
        )

    def test_export_requires_authentication(self):
        response = self.client.get(reverse('account-export'))

        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )


class AccountDeletionTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='deleteuser',
            email='delete@example.com',
            password='SecurePass123!',
        )

        self.workout = WorkoutSession.objects.create(
            user=self.user,
            workout_day=1,
            workout_title='Deletion Test Workout',
            completed_exercises=[],
            total_exercises=1,
            completion_percentage=0,
        )

        self.client.force_authenticate(user=self.user)

    def test_wrong_password_does_not_delete_account(self):
        response = self.client.post(
            reverse('account-delete'),
            {'password': 'WrongPassword123!'},
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertTrue(User.objects.filter(pk=self.user.pk).exists())
        self.assertTrue(
            WorkoutSession.objects.filter(pk=self.workout.pk).exists()
        )

    def test_correct_password_deletes_account_and_owned_data(self):
        user_id = self.user.pk
        workout_id = self.workout.pk

        response = self.client.post(
            reverse('account-delete'),
            {'password': 'SecurePass123!'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(User.objects.filter(pk=user_id).exists())
        self.assertFalse(
            WorkoutSession.objects.filter(pk=workout_id).exists()
        )
