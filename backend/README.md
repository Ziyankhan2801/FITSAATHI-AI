# FitSaathi AI – Backend

Django REST Framework backend for FitSaathi AI.

## Tech Stack

- Python 3.12+
- Django 5.2.18
- Django REST Framework
- PostgreSQL
- Google Gemini API
- Pillow
- django-cors-headers

## Setup

### 1. Create virtual environment

Run from the project root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 2. Install dependencies

```powershell
cd backend
pip install -r requirements.txt
```

### 3. Configure environment variables

Create your local `.env` file using the example template:

```powershell
Copy-Item .env.example .env
```

Open `backend/.env` and configure:

- `DJANGO_SECRET_KEY`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_PORT`
- `GEMINI_API_KEY`

Never commit the actual `.env` file or expose your credentials.

### 4. Configure PostgreSQL

Create a PostgreSQL database matching your `DB_NAME` setting.

For example:

```sql
CREATE DATABASE fitsaathi_db;
```

Ensure your PostgreSQL credentials match the values configured in `backend/.env`.

### 5. Apply migrations

```powershell
python manage.py migrate
```

### 6. Start development server

```powershell
python manage.py runserver
```

Backend development server:

`http://127.0.0.1:8000/`

## Validation

```powershell
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test api
```

## Environment Files

- `.env.example` – Safe configuration template.
- `.env` – Local secrets and credentials; never commit.

## Security

Production deployments must use:

- `DJANGO_DEBUG=False`
- A secure Django secret key
- A strong PostgreSQL password
- Configured allowed hosts
- HTTPS and secure cookie settings
- Correct CORS and CSRF trusted origins

## Project Structure

```text
backend/
├── api/
│   ├── migrations/
│   ├── services/
│   └── management/
├── config/
├── private_media/
├── .env.example
├── requirements.txt
└── manage.py
```
