from __future__ import annotations

from collections import defaultdict

from django.db.models import Q
from rest_framework.exceptions import ValidationError

from ..models import Exercise, FitnessProfile


GOAL_CATEGORY_PRIORITY = {
    FitnessProfile.FitnessGoal.WEIGHT_LOSS: [
        Exercise.Category.CARDIO,
        Exercise.Category.STRENGTH,
        Exercise.Category.MOBILITY,
        Exercise.Category.BALANCE,
        Exercise.Category.FLEXIBILITY,
    ],
    FitnessProfile.FitnessGoal.MUSCLE_GAIN: [
        Exercise.Category.STRENGTH,
        Exercise.Category.MOBILITY,
        Exercise.Category.FLEXIBILITY,
    ],
    FitnessProfile.FitnessGoal.GENERAL_FITNESS: [
        Exercise.Category.STRENGTH,
        Exercise.Category.CARDIO,
        Exercise.Category.MOBILITY,
        Exercise.Category.BALANCE,
        Exercise.Category.FLEXIBILITY,
    ],
    FitnessProfile.FitnessGoal.STAMINA: [
        Exercise.Category.CARDIO,
        Exercise.Category.STRENGTH,
        Exercise.Category.MOBILITY,
    ],
    FitnessProfile.FitnessGoal.FLEXIBILITY: [
        Exercise.Category.FLEXIBILITY,
        Exercise.Category.MOBILITY,
        Exercise.Category.BALANCE,
    ],
}

DIFFICULTY_LEVELS = {
    FitnessProfile.ExperienceLevel.BEGINNER: [Exercise.Difficulty.BEGINNER],
    FitnessProfile.ExperienceLevel.INTERMEDIATE: [
        Exercise.Difficulty.BEGINNER,
        Exercise.Difficulty.INTERMEDIATE,
    ],
    FitnessProfile.ExperienceLevel.ADVANCED: [
        Exercise.Difficulty.BEGINNER,
        Exercise.Difficulty.INTERMEDIATE,
        Exercise.Difficulty.ADVANCED,
    ],
}

# Kept for profiles that have not selected individual Equipment records yet.
EQUIPMENT_BY_LEVEL = {
    FitnessProfile.EquipmentLevel.NONE: [
        Exercise.Equipment.NONE,
        Exercise.Equipment.CHAIR,
    ],
    FitnessProfile.EquipmentLevel.BASIC: [
        Exercise.Equipment.NONE,
        Exercise.Equipment.CHAIR,
        Exercise.Equipment.MAT,
        Exercise.Equipment.DUMBBELL,
        Exercise.Equipment.RESISTANCE_BAND,
    ],
    FitnessProfile.EquipmentLevel.HOME_GYM: list(Exercise.Equipment.values),
}

# A training style may narrow the library, but general exercises remain usable
# when their training_style is blank.
STYLE_CATEGORY_PRIORITY = {
    "bodybuilding": [Exercise.Category.STRENGTH, Exercise.Category.FLEXIBILITY],
    "strength": [Exercise.Category.STRENGTH, Exercise.Category.MOBILITY],
    "powerlifting": [Exercise.Category.STRENGTH, Exercise.Category.MOBILITY],
    "olympic_weightlifting": [Exercise.Category.STRENGTH, Exercise.Category.MOBILITY],
    "functional": [
        Exercise.Category.STRENGTH,
        Exercise.Category.CARDIO,
        Exercise.Category.MOBILITY,
        Exercise.Category.BALANCE,
    ],
    "crossfit": [
        Exercise.Category.STRENGTH,
        Exercise.Category.CARDIO,
        Exercise.Category.MOBILITY,
    ],
    "hiit": [Exercise.Category.CARDIO, Exercise.Category.STRENGTH],
    "cardio": [Exercise.Category.CARDIO, Exercise.Category.MOBILITY],
    "calisthenics": [
        Exercise.Category.STRENGTH,
        Exercise.Category.MOBILITY,
        Exercise.Category.BALANCE,
    ],
    "yoga": [Exercise.Category.FLEXIBILITY, Exercise.Category.MOBILITY, Exercise.Category.BALANCE],
    "pilates": [Exercise.Category.STRENGTH, Exercise.Category.MOBILITY, Exercise.Category.FLEXIBILITY],
    "mobility": [Exercise.Category.MOBILITY, Exercise.Category.FLEXIBILITY, Exercise.Category.BALANCE],
    "sports": [
        Exercise.Category.CARDIO,
        Exercise.Category.STRENGTH,
        Exercise.Category.BALANCE,
        Exercise.Category.MOBILITY,
    ],
}

HOME_GYM_TYPES = {"home", "home_gym", "calisthenics"}
GYM_TYPES_WITH_BROAD_EQUIPMENT = {
    "commercial",
    "crossfit",
    "powerlifting",
    "fitness_studio",
    "hotel",
    "outdoor",
}


def _validate_profile(profile: FitnessProfile) -> None:
    required_fields = {
        "fitness_goal": profile.fitness_goal,
        "experience_level": profile.experience_level,
        "workout_days_per_week": profile.workout_days_per_week,
        "workout_minutes": profile.workout_minutes,
        "equipment_level": profile.equipment_level,
    }
    missing_fields = [field for field, value in required_fields.items() if not value]

    if missing_fields:
        raise ValidationError({
            "profile": (
                "Complete these fitness profile fields before generating "
                "a workout: " + ", ".join(missing_fields)
            )
        })

    if profile.has_health_limitation is None:
        raise ValidationError({
            "health_safety": (
                "Please confirm in your fitness profile whether you have "
                "any health limitations before generating a workout."
            )
        })

    if profile.has_health_limitation:
        raise ValidationError({
            "health_safety": (
                "Automatic workout generation is paused because a health "
                "limitation is recorded. Please seek guidance from a "
                "qualified healthcare or exercise professional before "
                "creating a routine."
            )
        })

    # WorkoutPlan currently has workout_day choices 1-3. Keep the generator
    # aligned with the existing save-plan API/model until that model is expanded.
    if not 1 <= profile.workout_days_per_week <= 3:
        raise ValidationError({
            "workout_days_per_week": (
                "The current workout planner supports 1 to 3 days per week."
            )
        })


def _target_exercise_count(minutes: int) -> int:
    if minutes <= 15:
        return 3
    if minutes <= 30:
        return 4
    if minutes <= 45:
        return 5
    return 6


def _adjust_prescription(exercise: Exercise, experience_level: str) -> dict:
    if experience_level == FitnessProfile.ExperienceLevel.BEGINNER:
        sets = min(exercise.sets, 2)
        rest_seconds = max(exercise.rest_seconds, 45)
    elif experience_level == FitnessProfile.ExperienceLevel.INTERMEDIATE:
        sets = min(max(exercise.sets, 2), 3)
        rest_seconds = max(exercise.rest_seconds, 30)
    else:
        sets = min(max(exercise.sets, 3), 4)
        rest_seconds = max(exercise.rest_seconds, 30)

    return {
        "sets": sets,
        "reps": exercise.reps,
        "rest_seconds": rest_seconds,
    }


def _get_category_priority(profile: FitnessProfile) -> list[str]:
    goal_categories = list(GOAL_CATEGORY_PRIORITY[profile.fitness_goal])
    style = getattr(profile, "training_style", None)

    if style:
        style_categories = STYLE_CATEGORY_PRIORITY.get(style)
        if style_categories:
            # Preserve goal relevance while prioritizing the selected style.
            return list(dict.fromkeys(style_categories + goal_categories))

    return goal_categories


def _get_candidate_exercises(profile: FitnessProfile, categories: list[str]):
    allowed_difficulties = DIFFICULTY_LEVELS[profile.experience_level]

    candidates = Exercise.objects.filter(
        is_active=True,
        category__in=categories,
        difficulty__in=allowed_difficulties,
    )

    selected_equipment = profile.available_equipment.all()
    if selected_equipment.exists():
        # An exercise with no required_equipment is bodyweight/general-purpose.
        # Otherwise, it must use equipment the user selected as available.
        candidates = candidates.filter(
            Q(required_equipment__isnull=True)
            | Q(required_equipment__in=selected_equipment)
        )
    else:
        # Backward-compatible fallback for profiles using the older equipment
        # level field and exercises using the older single equipment field.
        gym_type_for_equipment = getattr(profile, "gym_type", None)
        if gym_type_for_equipment in GYM_TYPES_WITH_BROAD_EQUIPMENT:
            allowed_legacy_equipment = list(Exercise.Equipment.values)
        else:
            allowed_legacy_equipment = EQUIPMENT_BY_LEVEL[profile.equipment_level]
        candidates = candidates.filter(equipment__in=allowed_legacy_equipment)

    selected_style = getattr(profile, "training_style", None)
    if selected_style:
        candidates = candidates.filter(
            Q(training_style=selected_style) | Q(training_style="")
        )

    gym_type = getattr(profile, "gym_type", None)
    if gym_type in HOME_GYM_TYPES:
        # Home/calisthenics plans should not accidentally include machine-only
        # exercises unless the user explicitly selected that equipment above.
        if not selected_equipment.exists():
            candidates = candidates.exclude(
                equipment__in=[
                    value for value in Exercise.Equipment.values
                    if value not in EQUIPMENT_BY_LEVEL[FitnessProfile.EquipmentLevel.BASIC]
                ]
            )

    return candidates.distinct().select_related().order_by("name")


def generate_personalized_workout(profile: FitnessProfile) -> dict:
    """
    Generate a deterministic, rule-based workout preview.

    Supports home and gym profiles, selected Equipment records, training
    styles, goals, and experience levels. It does not save WorkoutPlan records.
    """
    _validate_profile(profile)

    category_priority = _get_category_priority(profile)
    candidates = list(_get_candidate_exercises(profile, category_priority))

    if not candidates:
        raise ValidationError({
            "exercises": (
                "No active exercises match this profile. Check the selected "
                "gym type, training style and available equipment, or add "
                "matching exercises to the Exercise Library."
            )
        })

    exercises_by_category = defaultdict(list)
    for exercise in candidates:
        exercises_by_category[exercise.category].append(exercise)

    target_count = _target_exercise_count(profile.workout_minutes)
    days = []

    for day_number in range(1, profile.workout_days_per_week + 1):
        selected = []
        selected_ids = set()
        used_muscle_groups = set()

        offset = (day_number - 1) % len(category_priority)
        rotated_categories = (
            category_priority[offset:] + category_priority[:offset]
        )

        # First pass: prioritize category and muscle-group variety.
        while len(selected) < target_count:
            added_in_pass = False

            for category in rotated_categories:
                for exercise in exercises_by_category.get(category, []):
                    if exercise.id in selected_ids:
                        continue
                    if exercise.muscle_group in used_muscle_groups:
                        continue

                    selected.append(exercise)
                    selected_ids.add(exercise.id)
                    used_muscle_groups.add(exercise.muscle_group)
                    added_in_pass = True
                    break

                if len(selected) >= target_count:
                    break

            if not added_in_pass:
                break

        # Second pass: fill remaining slots when the library has limited
        # muscle-group variety.
        if len(selected) < target_count:
            for category in rotated_categories:
                for exercise in exercises_by_category.get(category, []):
                    if exercise.id in selected_ids:
                        continue

                    selected.append(exercise)
                    selected_ids.add(exercise.id)

                    if len(selected) >= target_count:
                        break

                if len(selected) >= target_count:
                    break

        planned_exercises = []
        for order, exercise in enumerate(selected):
            prescription = _adjust_prescription(
                exercise,
                profile.experience_level,
            )
            required_equipment = list(
                exercise.required_equipment.values("id", "name", "category")
            )

            planned_exercises.append({
                "exercise": exercise.id,
                "exercise_name": exercise.name,
                "description": exercise.description,
                "category": exercise.category,
                "muscle_group": exercise.muscle_group,
                "difficulty": exercise.difficulty,
                "equipment": exercise.equipment,
                "required_equipment": required_equipment,
                "training_style": exercise.training_style,
                "instructions": exercise.instructions,
                "safety_tips": exercise.safety_tips,
                "sets": prescription["sets"],
                "reps": prescription["reps"],
                "rest_seconds": prescription["rest_seconds"],
                "order": order,
            })

        goal_display = profile.get_fitness_goal_display()
        days.append({
            "workout_day": day_number,
            "title": f"Day {day_number} - {goal_display}",
            "focus": goal_display,
            "planned_exercises": planned_exercises,
        })

    selected_equipment_summary = list(
        profile.available_equipment.values("id", "name", "category")
    )

    return {
        "generation_type": "rule_based",
        "message": (
            "Workout preview generated from your fitness profile and the "
            "active Exercise Library. Review it before saving."
        ),
        "profile_summary": {
            "fitness_goal": profile.fitness_goal,
            "experience_level": profile.experience_level,
            "workout_days_per_week": profile.workout_days_per_week,
            "workout_minutes": profile.workout_minutes,
            "equipment_level": profile.equipment_level,
            "gym_type": getattr(profile, "gym_type", None),
            "training_style": getattr(profile, "training_style", None),
            "available_equipment": selected_equipment_summary,
        },
        "days": days,
        "safety_notice": (
            "This is a general fitness suggestion, not medical advice. "
            "Stop if an exercise causes pain, dizziness, or unusual "
            "breathlessness. Seek professional guidance if your health "
            "circumstances change."
        ),
    }
