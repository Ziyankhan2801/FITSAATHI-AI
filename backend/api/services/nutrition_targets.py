ACTIVITY_FACTORS = {
    "sedentary": 1.2,
    "light": 1.375,
    "moderate": 1.55,
    "very": 1.725,
    "extra": 1.9,
}


def calculate_targets(profile, settings):
    """Adult nutrition estimates; not medical advice."""

    from django.utils import timezone

    if not all((
        profile.date_of_birth,
        profile.height_cm,
        profile.weight_kg
    )):
        raise ValueError(
            "Add date of birth, height and weight to your fitness profile first."
        )

    today = timezone.localdate()
    dob = profile.date_of_birth

    age = (
        today.year
        - dob.year
        - ((today.month, today.day) < (dob.month, dob.day))
    )

    if age < 18 or age > 100:
        raise ValueError(
            "Personalized estimates are available for adults aged 18–100."
        )

    weight = float(profile.weight_kg)
    height = float(profile.height_cm)

    if not (25 <= height <= 250 and 30 <= weight <= 350):
        raise ValueError(
            "Profile height or weight is outside the supported estimation range."
        )

    sex_offset = (
        5 if settings.biological_sex == "male" else -161
    )

    # Mifflin-St Jeor formula
    bmr = (
        10 * weight
        + 6.25 * height
        - 5 * age
        + sex_offset
    )

    tdee = (
        bmr * ACTIVITY_FACTORS[settings.activity_level]
    )

    goal_adjustment = {
        "weight_loss": -300,
        "muscle_gain": 200,
    }.get(profile.fitness_goal, 0)

    calories = round(tdee + goal_adjustment)

    protein = round(
        weight * (
            1.6 if profile.fitness_goal == "muscle_gain"
            else 1.4
        )
    )

    fat = round(calories * 0.27 / 9)

    carbs = max(
        0,
        round(
            (calories - protein * 4 - fat * 9) / 4
        )
    )

    water = max(
        1500,
        min(round(weight * 35), 5000)
    )

    return {
        "configured": True,
        "age": age,
        "bmr": round(bmr),
        "tdee": round(tdee),
        "calories": calories,
        "protein_g": protein,
        "carbohydrates_g": carbs,
        "fat_g": fat,
        "water_ml": water,
        "method": "Mifflin-St Jeor estimate",
    }