from api.serializers import ProgressPhotoSerializer
from datetime import timedelta
from io import BytesIO

from PIL import Image

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.urls import reverse
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile

from api.models import (
    BodyMeasurement,
    PrivacyConsent,
    ProgressPhoto,
    WorkoutSession,
)

from rest_framework import status
from rest_framework.test import APITestCase, APIClient, APITransactionTestCase


User = get_user_model()


class RegistrationAPITests(APITestCase):

    def test_user_can_register_successfully(self):
        payload = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'TestPass123!',
            'password_confirm': 'TestPass123!',
        }

        response = self.client.post(
            reverse('register'),
            payload,
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            User.objects.filter(username='testuser').exists()
        )

        user = User.objects.get(username='testuser')

        self.assertTrue(user.check_password('TestPass123!'))
        self.assertNotEqual(user.password, 'TestPass123!')

    def test_registration_rejects_password_mismatch(self):
        payload = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'TestPass123!',
            'password_confirm': 'DifferentPass123!',
        }

        response = self.client.post(
            reverse('register'),
            payload,
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertFalse(
            User.objects.filter(username='testuser').exists()
        )

    def test_registration_rejects_duplicate_email(self):
        User.objects.create_user(
            username='existinguser',
            email='test@example.com',
            password='ExistingPass123!',
        )

        payload = {
            'username': 'newuser',
            'email': 'TEST@example.com',
            'password': 'TestPass123!',
            'password_confirm': 'TestPass123!',
        }

        response = self.client.post(
            reverse('register'),
            payload,
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertFalse(
            User.objects.filter(username='newuser').exists()
        )


class LoginAPITests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='loginuser',
            email='login@example.com',
            password='TestPass123!',
        )

    def test_user_can_login_with_valid_credentials(self):
        payload = {
            'username': 'loginuser',
            'password': 'TestPass123!',
        }

        response = self.client.post(
            reverse('login'),
            payload,
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertTrue(self.client.session.get('_auth_user_id'))

    def test_login_rejects_invalid_password(self):
        payload = {
            'username': 'loginuser',
            'password': 'WrongPassword123!',
        }

        response = self.client.post(
            reverse('login'),
            payload,
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertFalse(self.client.session.get('_auth_user_id'))

    def test_login_rejects_missing_credentials(self):
        response = self.client.post(
            reverse('login'),
            {},
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )


class LogoutAPITests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='logoutuser',
            email='logout@example.com',
            password='TestPass123!',
        )

    def test_authenticated_user_can_logout(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(reverse('logout'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')

    def test_unauthenticated_user_cannot_access_profile(self):
        response = self.client.get(reverse('current-user'))

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_authenticated_user_can_access_profile(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(reverse('current-user'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'logoutuser')
        self.assertEqual(response.data['email'], 'logout@example.com')


class FitnessProfileAPITests(APITestCase):

    def setUp(self):
        self.user1 = User.objects.create_user(
            username='fitnessuser1',
            email='fitness1@example.com',
            password='TestPass123!',
        )

        self.user2 = User.objects.create_user(
            username='fitnessuser2',
            email='fitness2@example.com',
            password='TestPass123!',
        )

    def test_authenticated_user_can_access_own_fitness_profile(self):
        self.client.force_authenticate(user=self.user1)

        response = self.client.get(reverse('fitness-profile'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertTrue(
            self.user1.fitness_profile is not None
        )

    def test_user_cannot_access_another_users_profile(self):
        self.client.force_authenticate(user=self.user1)

        response = self.client.get(reverse('fitness-profile'))

        self.client.force_authenticate(user=self.user2)

        second_response = self.client.get(reverse('fitness-profile'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_response.status_code, status.HTTP_200_OK)

        self.assertNotEqual(
            response.data['id'],
            second_response.data['id'],
        )

    def test_unauthenticated_user_cannot_access_fitness_profile(self):
        response = self.client.get(reverse('fitness-profile'))

        self.assertIn(
            response.status_code,
            [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN,
            ],
        )


class WorkoutOwnershipAPITests(APITestCase):

    def setUp(self):
        self.user1 = User.objects.create_user(
            username='workoutuser1',
            email='workout1@example.com',
            password='TestPass123!',
        )

        self.user2 = User.objects.create_user(
            username='workoutuser2',
            email='workout2@example.com',
            password='TestPass123!',
        )

        self.session = WorkoutSession.objects.create(
            user=self.user1,
            workout_day=1,
            workout_title='Full-body basics',
            completed_exercises=['pushups'],
            total_exercises=4,
            completion_percentage=25,
        )

    def test_user_cannot_view_another_users_workout(self):
        self.client.force_authenticate(user=self.user2)

        response = self.client.get(
            reverse('workout-detail', args=[self.session.id])
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_user_cannot_update_another_users_workout(self):
        self.client.force_authenticate(user=self.user2)

        response = self.client.patch(
            reverse('workout-detail', args=[self.session.id]),
            {'workout_title': 'Modified workout'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        self.session.refresh_from_db()
        self.assertEqual(self.session.workout_title, 'Full-body basics')

    def test_user_cannot_delete_another_users_workout(self):
        self.client.force_authenticate(user=self.user2)

        response = self.client.delete(
            reverse('workout-detail', args=[self.session.id])
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(
            WorkoutSession.objects.filter(id=self.session.id).exists()
        )


class SessionAuthenticationAPITests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='sessionuser',
            email='session@example.com',
            password='TestPass123!',
        )

    def test_login_creates_authenticated_session(self):
        response = self.client.post(
            reverse('login'),
            {
                'username': 'sessionuser',
                'password': 'TestPass123!',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('sessionid', response.cookies)
        self.assertTrue(self.client.session.get('_auth_user_id'))

    def test_session_can_access_current_user_endpoint(self):
        self.client.login(
            username='sessionuser',
            password='TestPass123!',
        )

        response = self.client.get(reverse('current-user'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'sessionuser')

    def test_logout_ends_authenticated_session(self):
        self.client.login(
            username='sessionuser',
            password='TestPass123!',
        )

        logout_response = self.client.post(reverse('logout'))

        self.assertEqual(
            logout_response.status_code,
            status.HTTP_200_OK,
        )

        self.assertFalse(self.client.session.get('_auth_user_id'))

        profile_response = self.client.get(reverse('current-user'))

        self.assertIn(
            profile_response.status_code,
            [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN,
            ],
        )


class CSRFProtectionTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='csrfuser',
            email='csrf@example.com',
            password='TestPass123!',
        )

        self.csrf_client = APIClient(enforce_csrf_checks=True)

    def test_authenticated_logout_requires_csrf_token(self):
        self.csrf_client.login(
            username='csrfuser',
            password='TestPass123!',
        )

        response = self.csrf_client.post(reverse('logout'))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authenticated_logout_accepts_valid_csrf_token(self):
        self.csrf_client.login(
            username='csrfuser',
            password='TestPass123!',
        )

        csrf_response = self.csrf_client.get(reverse('csrf-token'))

        self.assertEqual(csrf_response.status_code, status.HTTP_200_OK)

        csrf_token = csrf_response.data['csrfToken']

        response = self.csrf_client.post(
            reverse('logout'),
            HTTP_X_CSRFTOKEN=csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)


class FitnessProfileValidationTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='validationuser',
            email='validation@example.com',
            password='TestPass123!',
        )
        self.client.force_authenticate(user=self.user)
        self.url = reverse('fitness-profile')

    def test_rejects_height_below_minimum(self):
        response = self.client.patch(
            self.url,
            {'height_cm': 40},
            format='json',
        )
        self.assertEqual(response.status_code, 400)

    def test_rejects_weight_above_maximum(self):
        response = self.client.patch(
            self.url,
            {'weight_kg': 600},
            format='json',
        )
        self.assertEqual(response.status_code, 400)

    def test_rejects_invalid_workout_days(self):
        response = self.client.patch(
            self.url,
            {'workout_days_per_week': 8},
            format='json',
        )
        self.assertEqual(response.status_code, 400)

    def test_rejects_invalid_workout_minutes(self):
        response = self.client.patch(
            self.url,
            {'workout_minutes': 200},
            format='json',
        )
        self.assertEqual(response.status_code, 400)

    def test_rejects_invalid_sleep_hours(self):
        response = self.client.patch(
            self.url,
            {'sleep_hours': 25},
            format='json',
        )
        self.assertEqual(response.status_code, 400)

    def test_rejects_future_date_of_birth(self):
        future_date = timezone.localdate() + timedelta(days=1)

        response = self.client.patch(
            self.url,
            {'date_of_birth': future_date.isoformat()},
            format='json',
        )
        self.assertEqual(response.status_code, 400)


class BodyMeasurementAPITests(APITestCase):

    def setUp(self):
        self.user1 = User.objects.create_user(
            username='measurementuser1',
            email='measurement1@example.com',
            password='TestPass123!',
        )
        self.user2 = User.objects.create_user(
            username='measurementuser2',
            email='measurement2@example.com',
            password='TestPass123!',
        )

        self.client.force_authenticate(user=self.user1)
        self.list_url = reverse('body-measurement-list-create')
        self.test_date = timezone.localdate()

        self.payload = {
            'measurement_date': self.test_date.isoformat(),
            'weight_kg': '85.00',
            'waist_cm': '90.00',
            'chest_cm': '100.00',
            'hips_cm': '95.00',
            'left_arm_cm': '30.00',
            'right_arm_cm': '31.00',
            'left_thigh_cm': '50.00',
            'right_thigh_cm': '51.00',
        }

    def test_authenticated_user_can_create_measurement(self):
        response = self.client.post(
            self.list_url,
            self.payload,
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            BodyMeasurement.objects.filter(user=self.user1).count(),
            1,
        )
        self.assertEqual(response.data['weight_kg'], '85.00')

    def test_user_can_view_own_measurements(self):
        BodyMeasurement.objects.create(
            user=self.user1,
            measurement_date=self.test_date,
            weight_kg=85,
        )

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_user_cannot_view_another_users_measurements(self):
        BodyMeasurement.objects.create(
            user=self.user2,
            measurement_date=self.test_date,
            weight_kg=72,
        )

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_duplicate_measurement_for_same_date_is_rejected(self):
        BodyMeasurement.objects.create(
            user=self.user1,
            measurement_date=self.test_date,
            weight_kg=85,
        )

        response = self.client.post(
            self.list_url,
            self.payload,
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn('measurement_date', response.data)

    def test_user_can_update_own_measurement(self):
        measurement = BodyMeasurement.objects.create(
            user=self.user1,
            measurement_date=self.test_date,
            weight_kg=85,
        )
        detail_url = reverse(
            'body-measurement-detail',
            args=[measurement.id],
        )

        response = self.client.patch(
            detail_url,
            {'weight_kg': '84.50'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        measurement.refresh_from_db()
        self.assertEqual(str(measurement.weight_kg), '84.50')

    def test_future_measurement_date_is_rejected(self):
        future_date = timezone.localdate() + timedelta(days=1)
        payload = {
            'measurement_date': future_date.isoformat(),
            'weight_kg': '85.00',
        }

        response = self.client.post(
            self.list_url,
            payload,
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_user_cannot_update_another_users_measurement(self):
        measurement = BodyMeasurement.objects.create(
            user=self.user1,
            measurement_date=self.test_date,
            weight_kg=85,
        )
        self.client.force_authenticate(user=self.user2)

        detail_url = reverse(
            'body-measurement-detail',
            args=[measurement.id],
        )
        response = self.client.patch(
            detail_url,
            {'weight_kg': '70.00'},
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )
        measurement.refresh_from_db()
        self.assertEqual(str(measurement.weight_kg), '85.00')

    def test_user_can_delete_own_measurement(self):
        measurement = BodyMeasurement.objects.create(
            user=self.user1,
            measurement_date=self.test_date,
            weight_kg=85,
        )
        detail_url = reverse(
            'body-measurement-detail',
            args=[measurement.id],
        )

        response = self.client.delete(detail_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )
        self.assertFalse(
            BodyMeasurement.objects.filter(id=measurement.id).exists()
        )

    def test_unauthenticated_user_cannot_access_measurements(self):
        self.client.force_authenticate(user=None)

        response = self.client.get(self.list_url)

        self.assertIn(
            response.status_code,
            [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN,
            ],
        )


class PrivacyConsentModelTests(APITestCase):

    def setUp(self):
        self.user1 = User.objects.create_user(
            username='consentuser1',
            email='consent1@example.com',
            password='TestPass123!',
        )
        self.user2 = User.objects.create_user(
            username='consentuser2',
            email='consent2@example.com',
            password='TestPass123!',
        )

    def test_new_photo_storage_consent_can_be_created(self):
        consent = PrivacyConsent.objects.create(
            user=self.user1,
            consent_type=PrivacyConsent.ConsentType.PHOTO_STORAGE,
            is_granted=True,
            granted_at=timezone.now(),
        )

        self.assertTrue(consent.is_granted)
        self.assertEqual(consent.consent_type, 'photo_storage')
        self.assertIsNotNone(consent.granted_at)

    def test_ai_analysis_consent_can_be_created_separately(self):
        consent = PrivacyConsent.objects.create(
            user=self.user1,
            consent_type=PrivacyConsent.ConsentType.AI_ANALYSIS,
            is_granted=True,
            granted_at=timezone.now(),
        )

        self.assertTrue(consent.is_granted)
        self.assertEqual(consent.consent_type, 'ai_analysis')

    def test_same_user_cannot_have_duplicate_consent_type(self):
        PrivacyConsent.objects.create(
            user=self.user1,
            consent_type=PrivacyConsent.ConsentType.PHOTO_STORAGE,
            is_granted=True,
            granted_at=timezone.now(),
        )

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                PrivacyConsent.objects.create(
                    user=self.user1,
                    consent_type=PrivacyConsent.ConsentType.PHOTO_STORAGE,
                    is_granted=False,
                )

    def test_different_users_can_have_same_consent_type(self):
        consent1 = PrivacyConsent.objects.create(
            user=self.user1,
            consent_type=PrivacyConsent.ConsentType.PHOTO_STORAGE,
            is_granted=True,
            granted_at=timezone.now(),
        )
        consent2 = PrivacyConsent.objects.create(
            user=self.user2,
            consent_type=PrivacyConsent.ConsentType.PHOTO_STORAGE,
            is_granted=True,
            granted_at=timezone.now(),
        )

        self.assertNotEqual(consent1.user_id, consent2.user_id)
        self.assertEqual(
            PrivacyConsent.objects.filter(
                consent_type=PrivacyConsent.ConsentType.PHOTO_STORAGE
            ).count(),
            2,
        )

    def test_new_consent_defaults_to_not_granted(self):
        consent = PrivacyConsent.objects.create(
            user=self.user1,
            consent_type=PrivacyConsent.ConsentType.AI_ANALYSIS,
        )

        self.assertFalse(consent.is_granted)
        self.assertIsNone(consent.granted_at)
        self.assertIsNone(consent.withdrawn_at)



class PrivacyConsentAPITests(APITestCase):

    def setUp(self):
        self.user1 = User.objects.create_user(
            username='consentapiuser1',
            email='consentapi1@example.com',
            password='TestPass123!',
        )
        self.user2 = User.objects.create_user(
            username='consentapiuser2',
            email='consentapi2@example.com',
            password='TestPass123!',
        )

        self.client.force_authenticate(user=self.user1)

        self.list_url = reverse('privacy-consent-list-create')

    def test_authenticated_user_can_view_own_consents(self):
        PrivacyConsent.objects.create(
            user=self.user1,
            consent_type=PrivacyConsent.ConsentType.PHOTO_STORAGE,
            is_granted=True,
            granted_at=timezone.now(),
        )

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            response.data[0]['consent_type'],
            'photo_storage',
        )

    def test_user_cannot_view_another_users_consents(self):
        PrivacyConsent.objects.create(
            user=self.user2,
            consent_type=PrivacyConsent.ConsentType.PHOTO_STORAGE,
            is_granted=True,
            granted_at=timezone.now(),
        )

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_user_can_create_photo_storage_consent(self):
        response = self.client.post(
            self.list_url,
            {
                'consent_type': 'photo_storage',
                'is_granted': True,
            },
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        consent = PrivacyConsent.objects.get(
            user=self.user1,
            consent_type='photo_storage',
        )

        self.assertTrue(consent.is_granted)
        self.assertIsNotNone(consent.granted_at)

    def test_user_can_create_ai_analysis_consent_separately(self):
        response = self.client.post(
            self.list_url,
            {
                'consent_type': 'ai_analysis',
                'is_granted': True,
            },
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        consent = PrivacyConsent.objects.get(
            user=self.user1,
            consent_type='ai_analysis',
        )

        self.assertTrue(consent.is_granted)
        self.assertIsNotNone(consent.granted_at)

    def test_user_can_withdraw_consent(self):
        consent = PrivacyConsent.objects.create(
            user=self.user1,
            consent_type=PrivacyConsent.ConsentType.PHOTO_STORAGE,
            is_granted=True,
            granted_at=timezone.now(),
        )

        detail_url = reverse(
            'privacy-consent-detail',
            args=[consent.id],
        )

        response = self.client.patch(
            detail_url,
            {'is_granted': False},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        consent.refresh_from_db()

        self.assertFalse(consent.is_granted)
        self.assertIsNotNone(consent.withdrawn_at)

    def test_user_can_grant_consent_again_after_withdrawal(self):
        consent = PrivacyConsent.objects.create(
            user=self.user1,
            consent_type=PrivacyConsent.ConsentType.AI_ANALYSIS,
            is_granted=False,
        )

        detail_url = reverse(
            'privacy-consent-detail',
            args=[consent.id],
        )

        response = self.client.patch(
            detail_url,
            {'is_granted': True},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        consent.refresh_from_db()

        self.assertTrue(consent.is_granted)
        self.assertIsNotNone(consent.granted_at)
        self.assertIsNone(consent.withdrawn_at)

    def test_user_cannot_access_another_users_consent(self):
        consent = PrivacyConsent.objects.create(
            user=self.user1,
            consent_type=PrivacyConsent.ConsentType.PHOTO_STORAGE,
            is_granted=True,
            granted_at=timezone.now(),
        )

        self.client.force_authenticate(user=self.user2)

        detail_url = reverse(
            'privacy-consent-detail',
            args=[consent.id],
        )

        response = self.client.get(detail_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_unauthenticated_user_cannot_access_consents(self):
        self.client.force_authenticate(user=None)

        response = self.client.get(self.list_url)

        self.assertIn(
            response.status_code,
            [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN,
            ],
        )




class ProgressPhotoModelTests(APITestCase):

    def setUp(self):
        self.user1 = User.objects.create_user(
            username='photouser1',
            email='photo1@example.com',
            password='TestPass123!',
        )

        self.user2 = User.objects.create_user(
            username='photouser2',
            email='photo2@example.com',
            password='TestPass123!',
        )

        self.created_file_paths = []

    def tearDown(self):
        storage = ProgressPhoto._meta.get_field('image').storage

        for file_path in self.created_file_paths:
            if storage.exists(file_path):
                storage.delete(file_path)

    def create_photo(self, user, angle):
        photo = ProgressPhoto.objects.create(
            user=user,
            photo_angle=angle,
            image=SimpleUploadedFile(
                'progress.jpg',
                b'Test private progress photo',
                content_type='image/jpeg',
            ),
        )

        self.created_file_paths.append(photo.image.name)
        return photo

    def test_front_side_and_back_photos_can_be_created(self):
        angles = ['front', 'side', 'back']

        for angle in angles:
            with self.subTest(angle=angle):
                photo = self.create_photo(self.user1, angle)

                self.assertEqual(photo.photo_angle, angle)
                self.assertEqual(photo.user, self.user1)
                self.assertTrue(
                    photo.image.storage.exists(photo.image.name)
                )

    def test_photo_is_saved_in_user_private_folder(self):
        photo = self.create_photo(self.user1, 'front')

        expected_folder = f'progress_photos/user_{self.user1.id}/'

        self.assertTrue(
            photo.image.name.startswith(expected_folder)
        )

        self.assertTrue(
            photo.image.storage.exists(photo.image.name)
        )

    def test_same_filename_generates_unique_storage_paths(self):
        photo1 = self.create_photo(self.user1, 'front')
        photo2 = self.create_photo(self.user1, 'side')

        self.assertNotEqual(
            photo1.image.name,
            photo2.image.name,
        )

    def test_public_photo_url_is_blocked(self):
        photo = self.create_photo(self.user1, 'front')

        with self.assertRaises(ValueError):
            _ = photo.image.url

    def test_photos_belong_to_the_correct_users(self):
        photo1 = self.create_photo(self.user1, 'front')
        photo2 = self.create_photo(self.user2, 'back')

        self.assertEqual(photo1.user_id, self.user1.id)
        self.assertEqual(photo2.user_id, self.user2.id)

        self.assertEqual(
            ProgressPhoto.objects.filter(user=self.user1).count(),
            1,
        )

        self.assertEqual(
            ProgressPhoto.objects.filter(user=self.user2).count(),
            1,
        )

    def test_deleting_photo_also_deletes_image_file(self):
        photo = self.create_photo(self.user1, 'front')
        image_path = photo.image.name
        storage = photo.image.storage

        self.assertTrue(storage.exists(image_path))

        with self.captureOnCommitCallbacks(execute=True):
            photo.delete()

        self.assertFalse(
            ProgressPhoto.objects.filter(pk=photo.pk).exists()
        )
        self.assertFalse(storage.exists(image_path))

    def test_deleting_user_also_deletes_progress_photo_files(self):
        photo = self.create_photo(self.user1, 'front')
        image_path = photo.image.name
        storage = photo.image.storage

        self.assertTrue(storage.exists(image_path))

        with self.captureOnCommitCallbacks(execute=True):
            self.user1.delete()

        self.assertFalse(
            ProgressPhoto.objects.filter(user_id=self.user1.pk).exists()
        )
        self.assertFalse(storage.exists(image_path))

    def test_replacing_photo_deletes_old_file_and_keeps_new_file(self):
        photo = self.create_photo(self.user1, 'front')

        old_image_path = photo.image.name
        storage = photo.image.storage

        self.assertTrue(storage.exists(old_image_path))

        with self.captureOnCommitCallbacks(execute=True):
            photo.image = SimpleUploadedFile(
                'replacement.jpg',
                b'Replacement private progress photo',
                content_type='image/jpeg',
            )
            photo.save()

        photo.refresh_from_db()

        new_image_path = photo.image.name
        self.created_file_paths.append(new_image_path)

        self.assertNotEqual(old_image_path, new_image_path)
        self.assertFalse(storage.exists(old_image_path))
        self.assertTrue(storage.exists(new_image_path))



class ProgressPhotoSerializerTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='photoserializeruser',
            email='photoserializer@example.com',
            password='TestPass123!',
        )

        self.client.force_authenticate(user=self.user)

    def create_image(self, filename='progress.jpg',
                     content=None,
                     content_type='image/jpeg'):

        if content is None:
            image_formats = {
                'image/jpeg': 'JPEG',
                'image/png': 'PNG',
                'image/webp': 'WEBP',
                'image/gif': 'GIF',
            }
            image_format = image_formats.get(content_type, 'JPEG')

            image_buffer = BytesIO()
            test_image = Image.new('RGB', (16, 16), color=(40, 120, 200))
            test_image.save(image_buffer, format=image_format)
            content = image_buffer.getvalue()

        return SimpleUploadedFile(
            filename,
            content,
            content_type=content_type,
        )

    def grant_photo_consent(self):
        PrivacyConsent.objects.create(
            user=self.user,
            consent_type=PrivacyConsent.ConsentType.PHOTO_STORAGE,
            is_granted=True,
            granted_at=timezone.now(),
        )

    def test_valid_photo_is_accepted_with_storage_consent(self):
        self.grant_photo_consent()

        # Use an authenticated request-like object as serializer context.
        request = type(
            'Request',
            (),
            {'user': self.user},
        )()

        serializer = ProgressPhotoSerializer(
            data={
                'image': self.create_image(),
                'photo_angle': 'front',
            },
            context={'request': request},
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_upload_is_rejected_without_photo_storage_consent(self):
        request = type(
            'Request',
            (),
            {'user': self.user},
        )()

        serializer = ProgressPhotoSerializer(
            data={
                'image': self.create_image(),
                'photo_angle': 'front',
            },
            context={'request': request},
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn('consent', serializer.errors)

    def test_ai_analysis_consent_alone_does_not_allow_photo_upload(self):
        PrivacyConsent.objects.create(
            user=self.user,
            consent_type=PrivacyConsent.ConsentType.AI_ANALYSIS,
            is_granted=True,
            granted_at=timezone.now(),
        )

        request = type(
            'Request',
            (),
            {'user': self.user},
        )()

        serializer = ProgressPhotoSerializer(
            data={
                'image': self.create_image(),
                'photo_angle': 'front',
            },
            context={'request': request},
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn('consent', serializer.errors)

    def test_invalid_file_extension_is_rejected(self):
        self.grant_photo_consent()

        request = type(
            'Request',
            (),
            {'user': self.user},
        )()

        serializer = ProgressPhotoSerializer(
            data={
                'image': self.create_image(
                    filename='progress.gif',
                    content_type='image/gif',
                ),
                'photo_angle': 'front',
            },
            context={'request': request},
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn('image', serializer.errors)

    def test_image_larger_than_5_mb_is_rejected(self):
        self.grant_photo_consent()

        request = type(
            'Request',
            (),
            {'user': self.user},
        )()

        serializer = ProgressPhotoSerializer(
            data={
                'image': self.create_image(
                    content=(
                        self.create_image().read()
                        + b'0' * (5 * 1024 * 1024 + 1)
                    ),
                ),
                'photo_angle': 'front',
            },
            context={'request': request},
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn('image', serializer.errors)

class ProgressPhotoAPITests(APITestCase):

    def setUp(self):
        self.user1 = User.objects.create_user(
            username='photoapiuser1',
            email='photoapi1@example.com',
            password='TestPass123!',
        )
        self.user2 = User.objects.create_user(
            username='photoapiuser2',
            email='photoapi2@example.com',
            password='TestPass123!',
        )

        self.list_url = reverse('progress-photo-list-create')
        self.client.force_authenticate(user=self.user1)
        self.created_file_paths = []

        self.storage = ProgressPhoto._meta.get_field('image').storage

    def tearDown(self):
        for file_path in self.created_file_paths:
            if self.storage.exists(file_path):
                self.storage.delete(file_path)

    def create_image(self, filename='progress.jpg'):
        image_buffer = BytesIO()
        test_image = Image.new('RGB', (16, 16), color=(40, 120, 200))
        test_image.save(image_buffer, format='JPEG')
        return SimpleUploadedFile(
            filename,
            image_buffer.getvalue(),
            content_type='image/jpeg',
        )

    def grant_photo_consent(self, user=None):
        return PrivacyConsent.objects.create(
            user=user or self.user1,
            consent_type=PrivacyConsent.ConsentType.PHOTO_STORAGE,
            is_granted=True,
            granted_at=timezone.now(),
        )

    def test_authenticated_user_can_upload_photo_with_consent(self):
        self.grant_photo_consent()

        response = self.client.post(
            self.list_url,
            {
                'image': self.create_image(),
                'photo_angle': 'front',
            },
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn('image', response.data)

        photo = ProgressPhoto.objects.get(user=self.user1)
        self.created_file_paths.append(photo.image.name)

        self.assertEqual(photo.photo_angle, 'front')
        self.assertTrue(self.storage.exists(photo.image.name))

    def test_upload_is_rejected_without_photo_storage_consent(self):
        response = self.client.post(
            self.list_url,
            {
                'image': self.create_image(),
                'photo_angle': 'front',
            },
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('consent', response.data)
        self.assertFalse(ProgressPhoto.objects.filter(user=self.user1).exists())

    def test_authenticated_user_can_list_only_own_photos(self):
        self.grant_photo_consent()
        own_photo = ProgressPhoto.objects.create(
            user=self.user1,
            photo_angle='front',
            image=self.create_image('own.jpg'),
        )
        other_photo = ProgressPhoto.objects.create(
            user=self.user2,
            photo_angle='side',
            image=self.create_image('other.jpg'),
        )
        self.created_file_paths.extend([own_photo.image.name, other_photo.image.name])

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], own_photo.id)
        self.assertNotIn('image', response.data[0])

    def test_user_cannot_retrieve_another_users_photo(self):
        other_photo = ProgressPhoto.objects.create(
            user=self.user2,
            photo_angle='back',
            image=self.create_image('private.jpg'),
        )
        self.created_file_paths.append(other_photo.image.name)

        response = self.client.get(
            reverse('progress-photo-detail', args=[other_photo.id])
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_user_cannot_delete_another_users_photo(self):
        other_photo = ProgressPhoto.objects.create(
            user=self.user2,
            photo_angle='back',
            image=self.create_image('private-delete.jpg'),
        )
        self.created_file_paths.append(other_photo.image.name)

        response = self.client.delete(
            reverse('progress-photo-detail', args=[other_photo.id])
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(
            ProgressPhoto.objects.filter(pk=other_photo.pk).exists()
        )
        self.assertTrue(self.storage.exists(other_photo.image.name))

    def test_authenticated_user_can_delete_own_photo_and_file(self):
        photo = ProgressPhoto.objects.create(
            user=self.user1,
            photo_angle='front',
            image=self.create_image('delete-own.jpg'),
        )
        image_path = photo.image.name
        self.created_file_paths.append(image_path)

        self.assertTrue(self.storage.exists(image_path))

        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.delete(
                reverse('progress-photo-detail', args=[photo.id])
            )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(ProgressPhoto.objects.filter(pk=photo.pk).exists())
        self.assertFalse(self.storage.exists(image_path))

    def test_unauthenticated_user_cannot_list_photos(self):
        self.client.force_authenticate(user=None)

        response = self.client.get(self.list_url)

        self.assertIn(
            response.status_code,
            [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN,
            ],
        )

    def test_unauthenticated_user_cannot_upload_photo(self):
        self.client.force_authenticate(user=None)

        response = self.client.post(
            self.list_url,
            {
                'image': self.create_image(),
                'photo_angle': 'front',
            },
            format='multipart',
        )

        self.assertIn(
            response.status_code,
            [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN,
            ],
        )
        self.assertFalse(ProgressPhoto.objects.exists())

class PrivacyConsentPhotoDeletionAPITests(APITestCase):

    def setUp(self):
        self.user1 = User.objects.create_user(
            username='consentdeleteuser1',
            email='consentdelete1@example.com',
            password='TestPass123!',
        )
        self.user2 = User.objects.create_user(
            username='consentdeleteuser2',
            email='consentdelete2@example.com',
            password='TestPass123!',
        )
        self.client.force_authenticate(user=self.user1)
        self.storage = ProgressPhoto._meta.get_field('image').storage
        self.created_file_paths = []

    def tearDown(self):
        for file_path in self.created_file_paths:
            if self.storage.exists(file_path):
                self.storage.delete(file_path)

    def create_photo(self, user, angle, filename):
        photo = ProgressPhoto.objects.create(
            user=user,
            photo_angle=angle,
            image=SimpleUploadedFile(
                filename,
                b'Private test photo content',
                content_type='image/jpeg',
            ),
        )
        self.created_file_paths.append(photo.image.name)
        return photo

    def create_consent(self, user, consent_type):
        return PrivacyConsent.objects.create(
            user=user,
            consent_type=consent_type,
            is_granted=True,
            granted_at=timezone.now(),
        )

    def test_withdrawing_photo_consent_deletes_all_own_photos_and_files(self):
        consent = self.create_consent(
            self.user1,
            PrivacyConsent.ConsentType.PHOTO_STORAGE,
        )
        photo1 = self.create_photo(self.user1, 'front', 'front.jpg')
        photo2 = self.create_photo(self.user1, 'side', 'side.jpg')
        paths = [photo1.image.name, photo2.image.name]

        for path in paths:
            self.assertTrue(self.storage.exists(path))

        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.patch(
                reverse('privacy-consent-detail', args=[consent.id]),
                {'is_granted': False},
                format='json',
            )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        consent.refresh_from_db()
        self.assertFalse(consent.is_granted)
        self.assertIsNotNone(consent.withdrawn_at)

        self.assertFalse(
            ProgressPhoto.objects.filter(user=self.user1).exists()
        )
        for path in paths:
            self.assertFalse(self.storage.exists(path))

    def test_withdrawing_photo_consent_does_not_delete_other_users_photos(self):
        consent = self.create_consent(
            self.user1,
            PrivacyConsent.ConsentType.PHOTO_STORAGE,
        )
        other_photo = self.create_photo(
            self.user2,
            'back',
            'other-user.jpg',
        )
        other_path = other_photo.image.name

        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.patch(
                reverse('privacy-consent-detail', args=[consent.id]),
                {'is_granted': False},
                format='json',
            )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            ProgressPhoto.objects.filter(pk=other_photo.pk).exists()
        )
        self.assertTrue(self.storage.exists(other_path))

    def test_withdrawing_ai_consent_does_not_delete_progress_photos(self):
        consent = self.create_consent(
            self.user1,
            PrivacyConsent.ConsentType.AI_ANALYSIS,
        )
        photo = self.create_photo(self.user1, 'front', 'keep-photo.jpg')
        image_path = photo.image.name

        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.patch(
                reverse('privacy-consent-detail', args=[consent.id]),
                {'is_granted': False},
                format='json',
            )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            ProgressPhoto.objects.filter(pk=photo.pk).exists()
        )
        self.assertTrue(self.storage.exists(image_path))


class ProgressPhotoSecureImageAPITests(APITransactionTestCase):

    def setUp(self):
        self.user1 = User.objects.create_user(
            username='securephoto1',
            email='securephoto1@example.com',
            password='TestPass123!',
        )
        self.user2 = User.objects.create_user(
            username='securephoto2',
            email='securephoto2@example.com',
            password='TestPass123!',
        )

        self.storage = ProgressPhoto._meta.get_field('image').storage
        self.created_file_paths = []

        self.consent = PrivacyConsent.objects.create(
            user=self.user1,
            consent_type=PrivacyConsent.ConsentType.PHOTO_STORAGE,
            is_granted=True,
            granted_at=timezone.now(),
        )

        self.photo = self.create_photo(self.user1)

        self.image_url = reverse(
            'progress-photo-image',
            args=[self.photo.id],
        )

    def tearDown(self):
        for file_path in self.created_file_paths:
            if self.storage.exists(file_path):
                self.storage.delete(file_path)

        super().tearDown()

    def create_photo(self, user):
        photo = ProgressPhoto.objects.create(
            user=user,
            photo_angle='front',
            image=SimpleUploadedFile(
                'secure-progress.jpg',
                b'Private test image content',
                content_type='image/jpeg',
            ),
        )

        self.created_file_paths.append(photo.image.name)
        return photo

    def test_owner_can_access_own_progress_photo_image(self):
        self.client.force_authenticate(user=self.user1)

        response = self.client.get(self.image_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'image/jpeg')

        image_content = b''.join(response.streaming_content)

        self.assertEqual(
            image_content,
            b'Private test image content',
        )

        response.close()

    def test_another_user_cannot_access_progress_photo_image(self):
        self.client.force_authenticate(user=self.user2)

        response = self.client.get(self.image_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_withdrawn_photo_consent_blocks_image_access(self):
        self.consent.is_granted = False
        self.consent.withdrawn_at = timezone.now()
        self.consent.save(
            update_fields=['is_granted', 'withdrawn_at']
        )

        self.client.force_authenticate(user=self.user1)

        response = self.client.get(self.image_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_unauthenticated_user_cannot_access_image(self):
        self.client.force_authenticate(user=None)

        response = self.client.get(self.image_url)

        self.assertIn(
            response.status_code,
            [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN,
            ],
        )

    def test_image_response_has_private_no_cache_headers(self):
        self.client.force_authenticate(user=self.user1)

        response = self.client.get(self.image_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        cache_control = response.get('Cache-Control', '').lower()

        self.assertIn('private', cache_control)
        self.assertIn('no-store', cache_control)

        self.assertEqual(
            response.get('X-Content-Type-Options'),
            'nosniff',
        )
        response.close()
class EquipmentListAPITests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='equipment_test_user',
            email='equipment_test@example.com',
            password='TestPass123!',
        )

        self.client.force_authenticate(user=self.user)

        from api.models import Equipment

        self.bodyweight = Equipment.objects.create(
            name='Bodyweight',
            slug='bodyweight',
            category='bodyweight',
            description='Exercises using body weight.',
            is_active=True,
        )

        self.dumbbell = Equipment.objects.create(
            name='Dumbbell',
            slug='dumbbell',
            category='free_weights',
            description='Free weights for strength training.',
            is_active=True,
        )

        self.inactive = Equipment.objects.create(
            name='Inactive Equipment',
            slug='inactive-equipment',
            category='accessories',
            description='Inactive test equipment.',
            is_active=False,
        )

    def test_authenticated_user_can_list_active_equipment(self):
        response = self.client.get(reverse('equipment-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        names = [item['name'] for item in response.data]
        self.assertIn('Bodyweight', names)
        self.assertIn('Dumbbell', names)
        self.assertNotIn('Inactive Equipment', names)

    def test_equipment_search_by_name(self):
        response = self.client.get(
            reverse('equipment-list'),
            {'search': 'Dumbbell'},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        names = [item['name'] for item in response.data]
        self.assertEqual(names, ['Dumbbell'])

    def test_equipment_ordering_by_name(self):
        response = self.client.get(
            reverse('equipment-list'),
            {'ordering': 'name'},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        names = [item['name'] for item in response.data]
        self.assertEqual(names, sorted(names))

    def test_unauthenticated_user_cannot_list_equipment(self):
        self.client.force_authenticate(user=None)

        response = self.client.get(reverse('equipment-list'))

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )
