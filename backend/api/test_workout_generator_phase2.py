from django.contrib.auth import get_user_model
from django.test import TestCase

from api.models import Equipment, Exercise, FitnessProfile
from api.services.workout_generator import generate_personalized_workout


class PersonalizedWorkoutGeneratorPhase2Tests(TestCase):
    """Regression tests for home/gym, equipment and training-style filtering."""

    @classmethod
    def setUpTestData(cls):
        User = get_user_model()
        cls.user = User.objects.create_user(
            username="workout_generator_test",
            password="test-password-123",
        )
        cls.profile = FitnessProfile.objects.create(
            user=cls.user,
            fitness_goal=FitnessProfile.FitnessGoal.GENERAL_FITNESS,
            experience_level=FitnessProfile.ExperienceLevel.BEGINNER,
            workout_days_per_week=2,
            workout_minutes=30,
            equipment_level=FitnessProfile.EquipmentLevel.NONE,
            gym_type=FitnessProfile.GymType.HOME,
            training_style="",
            has_health_limitation=False,
        )

        cls.dumbbell = Equipment.objects.create(
            name="Test Dumbbell",
            slug="test-dumbbell",
            category=Equipment.Category.FREE_WEIGHTS,
        )
        cls.machine = Equipment.objects.create(
            name="Test Machine",
            slug="test-machine",
            category=Equipment.Category.MACHINES,
        )
        cls.barbell = Equipment.objects.create(
            name="Test Barbell",
            slug="test-barbell",
            category=Equipment.Category.FREE_WEIGHTS,
        )

    def make_exercise(
        self,
        name,
        *,
        equipment=Exercise.Equipment.NONE,
        training_style="",
        category=Exercise.Category.STRENGTH,
        muscle_group=Exercise.MuscleGroup.CHEST,
        difficulty=Exercise.Difficulty.BEGINNER,
        required_equipment=(),
        is_active=True,
    ):
        exercise = Exercise.objects.create(
            name=name,
            slug=name.lower().replace(" ", "-"),
            description=f"Test exercise: {name}",
            instructions=["Perform with controlled movement."],
            category=category,
            muscle_group=muscle_group,
            difficulty=difficulty,
            equipment=equipment,
            training_style=training_style,
            sets=2,
            reps="10 reps",
            rest_seconds=45,
            is_active=is_active,
        )
        if required_equipment:
            exercise.required_equipment.set(required_equipment)
        return exercise

    @staticmethod
    def selected_names(result):
        return {
            item["exercise_name"]
            for day in result["days"]
            for item in day["planned_exercises"]
        }

    def test_home_profile_uses_selected_equipment_and_bodyweight(self):
        bodyweight = self.make_exercise("Home Bodyweight Push")
        dumbbell = self.make_exercise(
            "Home Dumbbell Press",
            equipment=Exercise.Equipment.DUMBBELL,
            required_equipment=[self.dumbbell],
            muscle_group=Exercise.MuscleGroup.SHOULDERS,
        )
        machine = self.make_exercise(
            "Gym Machine Press",
            equipment=Exercise.Equipment.OTHER,
            required_equipment=[self.machine],
            muscle_group=Exercise.MuscleGroup.BACK,
        )
        self.profile.available_equipment.add(self.dumbbell)

        result = generate_personalized_workout(self.profile)
        names = self.selected_names(result)

        self.assertIn(bodyweight.name, names)
        self.assertIn(dumbbell.name, names)
        self.assertNotIn(machine.name, names)
        self.assertEqual(result["profile_summary"]["gym_type"], "home")
        self.assertEqual(
            result["profile_summary"]["available_equipment"][0]["name"],
            self.dumbbell.name,
        )

    def test_commercial_gym_can_use_broader_legacy_equipment(self):
        self.profile.gym_type = FitnessProfile.GymType.COMMERCIAL
        self.profile.equipment_level = FitnessProfile.EquipmentLevel.NONE
        self.profile.save(update_fields=["gym_type", "equipment_level"])

        gym_exercise = self.make_exercise(
            "Commercial Gym Barbell Lift",
            equipment=Exercise.Equipment.OTHER,
        )

        result = generate_personalized_workout(self.profile)
        self.assertIn(gym_exercise.name, self.selected_names(result))

    def test_crossfit_style_prioritizes_matching_and_general_exercises(self):
        self.profile.gym_type = FitnessProfile.GymType.CROSSFIT
        self.profile.training_style = FitnessProfile.TrainingStyle.CROSSFIT
        self.profile.equipment_level = FitnessProfile.EquipmentLevel.HOME_GYM
        self.profile.save(
            update_fields=["gym_type", "training_style", "equipment_level"]
        )

        matching = self.make_exercise(
            "Crossfit Strength Movement",
            training_style=FitnessProfile.TrainingStyle.CROSSFIT,
            equipment=Exercise.Equipment.OTHER,
        )
        general = self.make_exercise(
            "General Strength Movement",
            muscle_group=Exercise.MuscleGroup.BACK,
            equipment=Exercise.Equipment.OTHER,
        )
        unrelated = self.make_exercise(
            "Bodybuilding Only Movement",
            training_style=FitnessProfile.TrainingStyle.BODYBUILDING,
            muscle_group=Exercise.MuscleGroup.LEGS,
            equipment=Exercise.Equipment.OTHER,
        )

        names = self.selected_names(generate_personalized_workout(self.profile))
        self.assertIn(matching.name, names)
        self.assertIn(general.name, names)
        self.assertNotIn(unrelated.name, names)

    def test_bodybuilding_style_filters_out_other_explicit_styles(self):
        self.profile.gym_type = FitnessProfile.GymType.COMMERCIAL
        self.profile.training_style = FitnessProfile.TrainingStyle.BODYBUILDING
        self.profile.equipment_level = FitnessProfile.EquipmentLevel.HOME_GYM
        self.profile.save(
            update_fields=["gym_type", "training_style", "equipment_level"]
        )

        bodybuilding = self.make_exercise(
            "Bodybuilding Chest Exercise",
            training_style=FitnessProfile.TrainingStyle.BODYBUILDING,
            equipment=Exercise.Equipment.OTHER,
        )
        general = self.make_exercise(
            "General Strength Exercise",
            muscle_group=Exercise.MuscleGroup.BACK,
            equipment=Exercise.Equipment.OTHER,
        )
        yoga = self.make_exercise(
            "Yoga Only Exercise",
            training_style=FitnessProfile.TrainingStyle.YOGA,
            category=Exercise.Category.FLEXIBILITY,
            muscle_group=Exercise.MuscleGroup.LEGS,
            equipment=Exercise.Equipment.OTHER,
        )

        names = self.selected_names(generate_personalized_workout(self.profile))
        self.assertIn(bodybuilding.name, names)
        self.assertIn(general.name, names)
        self.assertNotIn(yoga.name, names)

    def test_beginner_profile_excludes_intermediate_and_advanced_exercises(self):
        beginner = self.make_exercise("Beginner Strength")
        intermediate = self.make_exercise(
            "Intermediate Strength",
            difficulty=Exercise.Difficulty.INTERMEDIATE,
            muscle_group=Exercise.MuscleGroup.BACK,
        )
        advanced = self.make_exercise(
            "Advanced Strength",
            difficulty=Exercise.Difficulty.ADVANCED,
            muscle_group=Exercise.MuscleGroup.LEGS,
        )

        names = self.selected_names(generate_personalized_workout(self.profile))
        self.assertIn(beginner.name, names)
        self.assertNotIn(intermediate.name, names)
        self.assertNotIn(advanced.name, names)

    def test_inactive_exercises_are_never_selected(self):
        active = self.make_exercise("Active Strength")
        inactive = self.make_exercise("Inactive Strength", is_active=False)

        names = self.selected_names(generate_personalized_workout(self.profile))
        self.assertIn(active.name, names)
        self.assertNotIn(inactive.name, names)

    def test_no_matching_exercises_returns_validation_error(self):
        self.profile.fitness_goal = FitnessProfile.FitnessGoal.FLEXIBILITY
        self.profile.save(update_fields=["fitness_goal"])
        self.make_exercise(
            "Only Strength Exercise",
            category=Exercise.Category.STRENGTH,
        )

        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError):
            generate_personalized_workout(self.profile)

    def test_preview_contains_prescription_and_safety_notice(self):
        self.make_exercise("Preview Strength Exercise")

        result = generate_personalized_workout(self.profile)

        self.assertEqual(result["generation_type"], "rule_based")
        self.assertEqual(len(result["days"]), 2)
        self.assertTrue(result["safety_notice"])
        first_exercise = result["days"][0]["planned_exercises"][0]
        self.assertEqual(first_exercise["sets"], 2)
        self.assertIn("rest_seconds", first_exercise)
        self.assertIn("required_equipment", first_exercise)
        self.assertIn("training_style", first_exercise)
