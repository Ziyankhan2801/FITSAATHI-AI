
import logging

from django.conf import settings
from google import genai
from google.genai import types


logger = logging.getLogger(__name__)


SYSTEM_INSTRUCTION = """
You are FitSaathi AI, a friendly and responsible personal fitness coach.

Your responsibilities:
- Help users with home workouts and gym workouts.
- Explain exercises, training styles, recovery and fitness habits.
- Personalize advice using only the fitness context provided.
- Give practical, beginner-friendly guidance.
- Never claim to diagnose or treat a medical condition.
- Never recommend training through sharp pain, chest pain, dizziness,
  breathing difficulty or serious injury.
- For urgent symptoms, advise stopping exercise and seeking medical care.
- Do not invent user measurements, health conditions or workout history.
- Do not prescribe extreme diets, starvation or unsafe supplements.
- Be supportive, clear and concise.
"""


class GeminiServiceError(Exception):
    """Raised when the Gemini service cannot complete a request."""


def generate_coach_response(messages, fitness_context=""):
    if not settings.GEMINI_API_KEY:
        raise GeminiServiceError("AI service is not configured.")

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        conversation = []

        for message in messages:
            role = (
                "user"
                if message["role"] == "user"
                else "model"
            )
            conversation.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=message["content"])],
                )
            )

        prompt_instruction = SYSTEM_INSTRUCTION

        if fitness_context:
            prompt_instruction += (
                "\n\nUser's available fitness profile context:\n"
                + fitness_context
            )

        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=conversation,
            config=types.GenerateContentConfig(
                system_instruction=prompt_instruction,
                max_output_tokens=settings.GEMINI_MAX_OUTPUT_TOKENS,
                temperature=0.7,
            ),
        )

        answer = (response.text or "").strip()

        if not answer:
            raise GeminiServiceError("The AI returned an empty response.")

        return answer

    except GeminiServiceError:
        raise
    except Exception as exc:
        logger.exception("Gemini request failed.")
        raise GeminiServiceError(
            "The AI coach is temporarily unavailable. Please try again."
        ) from exc
