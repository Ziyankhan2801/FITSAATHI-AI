
from django.core.management.base import BaseCommand
from django.utils.text import slugify

from api.models import FoodItem


FOODS = [
    # Grains and cereals
    {
        'name': 'Cooked White Rice',
        'category': 'grains',
        'serving_size_g': 100,
        'calories': 130,
        'protein_g': 2.7,
        'carbohydrates_g': 28.2,
        'fat_g': 0.3,
        'fiber_g': 0.4,
        'is_vegetarian': True,
    },
    {
        'name': 'Whole Wheat Roti',
        'category': 'grains',
        'serving_size_g': 40,
        'calories': 120,
        'protein_g': 3.5,
        'carbohydrates_g': 22,
        'fat_g': 2,
        'fiber_g': 3,
        'is_vegetarian': True,
    },
    {
        'name': 'Poha',
        'category': 'grains',
        'serving_size_g': 100,
        'calories': 180,
        'protein_g': 3.5,
        'carbohydrates_g': 30,
        'fat_g': 5,
        'fiber_g': 2,
        'is_vegetarian': True,
    },
    {
        'name': 'Oats',
        'category': 'grains',
        'serving_size_g': 100,
        'calories': 389,
        'protein_g': 16.9,
        'carbohydrates_g': 66.3,
        'fat_g': 6.9,
        'fiber_g': 10.6,
        'is_vegetarian': True,
    },
    {
        'name': 'Cooked Upma',
        'category': 'grains',
        'serving_size_g': 100,
        'calories': 150,
        'protein_g': 4,
        'carbohydrates_g': 25,
        'fat_g': 4,
        'fiber_g': 2,
        'is_vegetarian': True,
    },

    # Dairy
    {
        'name': 'Whole Milk',
        'category': 'dairy',
        'serving_size_g': 100,
        'calories': 61,
        'protein_g': 3.2,
        'carbohydrates_g': 4.8,
        'fat_g': 3.3,
        'fiber_g': 0,
        'is_vegetarian': True,
    },
    {
        'name': 'Plain Curd',
        'category': 'dairy',
        'serving_size_g': 100,
        'calories': 98,
        'protein_g': 3.5,
        'carbohydrates_g': 4.7,
        'fat_g': 5,
        'fiber_g': 0,
        'is_vegetarian': True,
    },
    {
        'name': 'Paneer',
        'category': 'dairy',
        'serving_size_g': 100,
        'calories': 265,
        'protein_g': 18.3,
        'carbohydrates_g': 1.2,
        'fat_g': 20.8,
        'fiber_g': 0,
        'is_vegetarian': True,
    },

    # Protein sources
    {
        'name': 'Boiled Egg',
        'category': 'protein',
        'serving_size_g': 50,
        'calories': 78,
        'protein_g': 6.3,
        'carbohydrates_g': 0.6,
        'fat_g': 5.3,
        'fiber_g': 0,
        'is_vegetarian': False,
    },
    {
        'name': 'Cooked Chicken Breast',
        'category': 'protein',
        'serving_size_g': 100,
        'calories': 165,
        'protein_g': 31,
        'carbohydrates_g': 0,
        'fat_g': 3.6,
        'fiber_g': 0,
        'is_vegetarian': False,
    },
    {
        'name': 'Cooked Soya Chunks',
        'category': 'protein',
        'serving_size_g': 100,
        'calories': 172,
        'protein_g': 18,
        'carbohydrates_g': 12,
        'fat_g': 0.5,
        'fiber_g': 5,
        'is_vegetarian': True,
    },
    {
        'name': 'Cooked Dal',
        'category': 'legumes',
        'serving_size_g': 100,
        'calories': 116,
        'protein_g': 9,
        'carbohydrates_g': 20,
        'fat_g': 0.4,
        'fiber_g': 7.9,
        'is_vegetarian': True,
    },

    # Fruits
    {
        'name': 'Banana',
        'category': 'fruits',
        'serving_size_g': 100,
        'calories': 89,
        'protein_g': 1.1,
        'carbohydrates_g': 22.8,
        'fat_g': 0.3,
        'fiber_g': 2.6,
        'is_vegetarian': True,
    },
    {
        'name': 'Apple',
        'category': 'fruits',
        'serving_size_g': 100,
        'calories': 52,
        'protein_g': 0.3,
        'carbohydrates_g': 13.8,
        'fat_g': 0.2,
        'fiber_g': 2.4,
        'is_vegetarian': True,
    },

    # Nuts and seeds
    {
        'name': 'Almonds',
        'category': 'nuts',
        'serving_size_g': 100,
        'calories': 579,
        'protein_g': 21.2,
        'carbohydrates_g': 21.6,
        'fat_g': 49.9,
        'fiber_g': 12.5,
        'is_vegetarian': True,
    },
    {
        'name': 'Peanuts',
        'category': 'nuts',
        'serving_size_g': 100,
        'calories': 567,
        'protein_g': 25.8,
        'carbohydrates_g': 16.1,
        'fat_g': 49.2,
        'fiber_g': 8.5,
        'is_vegetarian': True,
    },

    # Vegetables
    {
        'name': 'Boiled Potato',
        'category': 'vegetables',
        'serving_size_g': 100,
        'calories': 87,
        'protein_g': 1.9,
        'carbohydrates_g': 20.1,
        'fat_g': 0.1,
        'fiber_g': 1.8,
        'is_vegetarian': True,
    },
    {
        'name': 'Spinach',
        'category': 'vegetables',
        'serving_size_g': 100,
        'calories': 23,
        'protein_g': 2.9,
        'carbohydrates_g': 3.6,
        'fat_g': 0.4,
        'fiber_g': 2.2,
        'is_vegetarian': True,
    },
]


class Command(BaseCommand):
    help = 'Seed the database with starter Indian-friendly food items.'

    def handle(self, *args, **options):
        created_count = 0
        updated_count = 0

        for food_data in FOODS:
            data = food_data.copy()
            name = data.pop('name')
            slug = slugify(name)

            _, created = FoodItem.objects.update_or_create(
                slug=slug,
                defaults={
                    'name': name,
                    **data,
                },
            )

            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Food seeding completed: '
                f'{created_count} created, '
                f'{updated_count} updated.'
            )
        )
