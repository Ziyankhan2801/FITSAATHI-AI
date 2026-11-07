from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import Exercise, FitnessProfile


class GenerateWorkoutAPITests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        User = get_user_model()
        cls.user = User.objects.create_user(
            username="generate_api_user",
            password="test-password-123",
        )

    def setUp(self):
        self.client.force_authenticate(user=self.user)
        self.url = reverse("generate-workout")

    def create_valid_profile(self, **overrides):
        values = {
            "fitness_goal": FitnessProfile.FitnessGoal.GENERAL_FITNESS,
            "experience_level": FitnessProfile.ExperienceLevel.BEGINNER,
            "workout_days_per_week": 2,
            "workout_minutes": 30,
            "equipment_level": FitnessProfile.EquipmentLevel.NONE,
            "gym_type": FitnessProfile.GymType.HOME,
            "training_style": "",
            "has_health_limitation": False,
        }
        values.update(overrides)
        return FitnessProfile.objects.create(user=self.user, **values)

    def create_exercise(self):
        return Exercise.objects.create(
            name="API Test Bodyweight Squat",
            slug="api-test-bodyweight-squat",
            description="A test bodyweight squat.",
            instructions=["Stand tall.", "Squat with control."],
            category=Exercise.Category.STRENGTH,
            muscle_group=Exercise.MuscleGroup.LEGS,
            difficulty=Exercise.Difficulty.BEGINNER,
            equipment=Exercise.Equipment.NONE,
            training_style="",
            sets=2,
            reps="10 reps",
            rest_seconds=45,
            is_active=True,
        )

    def test_authenticated_user_gets_personalized_workout_preview(self):
        self.create_valid_profile()
        self.create_exercise()

        response = self.client.post(self.url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["generation_type"], "rule_based")
        self.assertEqual(len(response.data["days"]), 2)
        self.assertTrue(response.data["days"][0]["planned_exercises"])
        self.assertIn("safety_notice", response.data)

    def test_unauthenticated_user_cannot_generate_workout(self):
        self.client.force_authenticate(user=None)

        response = self.client.post(self.url, {}, format="json")

        self.assertIn(response.status_code, [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        ])

    def test_incomplete_profile_returns_validation_error(self):
        # The view creates a blank profile automatically when none exists.
        response = self.client.post(self.url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("profile", response.data)

    def test_health_limitation_blocks_generation(self):
        self.create_valid_profile(has_health_limitation=True)
        self.create_exercise()

        response = self.client.post(self.url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("health_safety", response.data)
