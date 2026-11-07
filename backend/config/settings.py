
"""
Django settings for FitSaathi AI.

Local development works with the existing backend/.env file.
Production mode is enabled by setting DJANGO_DEBUG=False and supplying
the required secrets and deployment-specific origins/hosts.
"""

import os
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent

# Load backend/.env. Environment variables supplied by the hosting platform
# take precedence over values in this file.
load_dotenv(BASE_DIR / ".env")


def env_bool(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).strip().lower() in {
        "1", "true", "yes", "on"
    }


def env_list(name: str, default: str = "") -> list[str]:
    return [
        item.strip()
        for item in os.getenv(name, default).split(",")
        if item.strip()
    ]


# Gemini AI configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
GEMINI_MAX_OUTPUT_TOKENS = int(
    os.getenv("GEMINI_MAX_OUTPUT_TOKENS", "1200")
)


# Core security settings
DEBUG = env_bool("DJANGO_DEBUG", True)

SECRET_KEY = os.getenv(
    "DJANGO_SECRET_KEY",
    "django-insecure-dev-only-key-change-before-deployment",
)

if not DEBUG:
    if not os.getenv("DJANGO_SECRET_KEY"):
        raise RuntimeError(
            "DJANGO_SECRET_KEY must be configured when DJANGO_DEBUG=False."
        )

    if not os.getenv("DB_PASSWORD"):
        raise RuntimeError(
            "DB_PASSWORD must be configured when DJANGO_DEBUG=False."
        )

    if not os.getenv("DJANGO_ALLOWED_HOSTS"):
        raise RuntimeError(
            "DJANGO_ALLOWED_HOSTS must be configured when DJANGO_DEBUG=False."
        )

ALLOWED_HOSTS = env_list(
    "DJANGO_ALLOWED_HOSTS",
    "localhost,127.0.0.1" if DEBUG else "",
)


# Application definition
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "api",
]


MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# PostgreSQL database configuration
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME", "fitsaathi_db"),
        "USER": os.getenv("DB_USER", "postgres"),
        "PASSWORD": os.getenv("DB_PASSWORD", ""),
        "HOST": os.getenv("DB_HOST", "127.0.0.1"),
        "PORT": os.getenv("DB_PORT", "5432"),
        "CONN_MAX_AGE": int(os.getenv("DB_CONN_MAX_AGE", "60")),
    }
}


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True


# Static files
STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# Email configuration
EMAIL_BACKEND = os.getenv(
    "EMAIL_BACKEND",
    "django.core.mail.backends.console.EmailBackend"
    if DEBUG
    else "django.core.mail.backends.smtp.EmailBackend",
)

EMAIL_HOST = os.getenv("EMAIL_HOST", "")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = env_bool("EMAIL_USE_TLS", True)
EMAIL_USE_SSL = env_bool("EMAIL_USE_SSL", False)

DEFAULT_FROM_EMAIL = os.getenv(
    "DEFAULT_FROM_EMAIL",
    "FitSaathi AI <noreply@fitsaathi.local>",
)

FRONTEND_BASE_URL = os.getenv(
    "FRONTEND_BASE_URL",
    "http://localhost:5173",
)


# Private user-uploaded media
PRIVATE_MEDIA_ROOT = BASE_DIR / "private_media"


# Django REST Framework
REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "ai_chat": "10/minute",
        "generate_workout": "5/minute",
        "login": "5/minute",
        "register": "3/hour",
        "password_reset": "3/hour",
        "password_reset_confirm": "5/hour",
    },
}


# CORS and CSRF origins
# Vite development server and production preview server.
LOCAL_FRONTEND_ORIGINS = (
    [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ]
    if DEBUG
    else []
)

# Preserve origins configured through .env and add local development origins.
CORS_ALLOWED_ORIGINS = list(dict.fromkeys(
    env_list("DJANGO_CORS_ALLOWED_ORIGINS") + LOCAL_FRONTEND_ORIGINS
))

CSRF_TRUSTED_ORIGINS = list(dict.fromkeys(
    env_list("DJANGO_CSRF_TRUSTED_ORIGINS") + LOCAL_FRONTEND_ORIGINS
))

CORS_ALLOW_CREDENTIALS = True


# Session and CSRF cookies
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"

CSRF_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_HTTPONLY = False

SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG


# HTTPS and browser security headers
SECURE_SSL_REDIRECT = env_bool(
    "DJANGO_SECURE_SSL_REDIRECT",
    not DEBUG,
)

SECURE_HSTS_SECONDS = int(
    os.getenv(
        "DJANGO_SECURE_HSTS_SECONDS",
        "31536000" if not DEBUG else "0"
    )
)

SECURE_HSTS_INCLUDE_SUBDOMAINS = env_bool(
    "DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS", False
)

SECURE_HSTS_PRELOAD = env_bool(
    "DJANGO_SECURE_HSTS_PRELOAD", False
)

SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SECURE_REFERRER_POLICY = "same-origin"


# Enable only behind a trusted reverse proxy that sets this header reliably.
if env_bool("DJANGO_TRUST_X_FORWARDED_PROTO", False):
    SECURE_PROXY_SSL_HEADER = (
        "HTTP_X_FORWARDED_PROTO",
        "https"
    )
