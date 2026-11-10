
from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import Equipment, Exercise


EQUIPMENT_ITEMS = [
    {
        "name": "Bodyweight",
        "slug": "bodyweight",
        "category": Equipment.Category.BODYWEIGHT,
        "description": "Exercises performed using your own body weight without external equipment.",
    },
    {
        "name": "Dumbbell",
        "slug": "dumbbell",
        "category": Equipment.Category.FREE_WEIGHTS,
        "description": "Free weights used for strength training and resistance exercises.",
    },
    {
        "name": "Resistance Band",
        "slug": "resistance-band",
        "category": Equipment.Category.ACCESSORIES,
        "description": "Elastic bands used for resistance and mobility training.",
    },
    {
        "name": "Chair",
        "slug": "chair",
        "category": Equipment.Category.ACCESSORIES,
        "description": "A stable chair used for supported exercises and balance.",
    },
    {
        "name": "Exercise Mat",
        "slug": "exercise-mat",
        "category": Equipment.Category.ACCESSORIES,
        "description": "A mat providing a comfortable surface for floor exercises.",
    },
    {
        "name": "Barbell",
        "slug": "barbell",
        "category": Equipment.Category.FREE_WEIGHTS,
        "description": "A weighted bar used for resistance and strength training.",
    },
]


EXERCISE_EQUIPMENT_MAP = {
    "chair-sit-to-stand": ["chair"],
    "supported-calf-raises": ["chair"],
    "glute-bridges": ["exercise-mat"],
    "cat-cow-stretch": ["exercise-mat"],
}


class Command(BaseCommand):
    help = "Seed equipment catalog and link existing exercises."

    @transaction.atomic
    def handle(self, *args, **options):
        created_count = 0
        updated_count = 0

        for item in EQUIPMENT_ITEMS:
            _, created = Equipment.objects.update_or_create(
                slug=item["slug"],
                defaults=item,
            )

            if created:
                created_count += 1
            else:
                updated_count += 1

        linked_count = 0

        for exercise_slug, equipment_slugs in EXERCISE_EQUIPMENT_MAP.items():
            exercise = Exercise.objects.filter(
                slug=exercise_slug,
                is_active=True,
            ).first()

            if not exercise:
                self.stdout.write(
                    self.style.WARNING(
                        f"Exercise not found: {exercise_slug}"
                    )
                )
                continue

            equipment = Equipment.objects.filter(
                slug__in=equipment_slugs,
                is_active=True,
            )

            exercise.required_equipment.set(equipment)
            linked_count += equipment.count()

        self.stdout.write(
            self.style.SUCCESS(
                f"Equipment seeding completed. "
                f"Created: {created_count}, "
                f"Updated: {updated_count}, "
                f"Exercise links: {linked_count}"
            )
        )
