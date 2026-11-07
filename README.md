# FitSaathi AI 💪

**Your Personal AI-Powered Home Fitness Companion**

FitSaathi AI is an AI-powered home fitness coaching web application designed to help users build healthier habits through personalized workout plans, exercise guidance, nutrition tracking, and progress monitoring — without requiring a gym membership.

## ✨ Features

- **Personalized Fitness Plans:** Workout recommendations based on fitness profile, goals, experience, and available equipment.
- **Workout Studio:** Guided workout sessions and exercise tracking.
- **AI Fitness Coach:** AI-powered fitness assistance and conversational guidance.
- **Camera Coach:** Exercise movement guidance using MediaPipe pose detection.
- **Nutrition Coach:** Food logging, nutrition targets, and daily nutrition tracking.
- **Progress Tracking:** Monitor workout activity and fitness progress.
- **Schedule Management:** Organize weekly workout schedules.
- **User Authentication:** Account registration, login, and account management.
- **Privacy Controls:** User consent and privacy management features.

## 🛠️ Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide React
- MediaPipe

### Backend
- Python
- Django
- Django REST Framework
- PostgreSQL
- Google Gemini API

### Development Tools
- Git & GitHub
- VS Code
- npm
- Python Virtual Environment

## 📁 Project Structure

```text
FitSaathi AI/
│
├── backend/
│   ├── api/
│   ├── config/
│   ├── private_media/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   ├── .env.example
│   └── README.md
│
├── .gitignore
└── README.md
```

## ⚙️ Getting Started

### Prerequisites

Install the following before starting:

- Node.js and npm
- Python 3.12+
- PostgreSQL
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Ziyankhan2801/FITSAATHI-AI.git
cd FITSAATHI-AI
```

### 2. Backend Setup

Create a Python virtual environment from the project root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install backend dependencies:

```powershell
cd backend
python -m pip install -r requirements.txt
```

Create your local environment file:

```powershell
Copy-Item .env.example .env
```

Open `backend/.env` and configure your local PostgreSQL credentials and other required settings.

Create a PostgreSQL database matching your `DB_NAME` setting. For example:

```sql
CREATE DATABASE fitsaathi_db;
```

Apply database migrations:

```powershell
python manage.py migrate
```

Start the backend development server:

```powershell
python manage.py runserver
```

The backend will be available at:

`http://localhost:8000/`

### 3. Frontend Setup

Open a **separate terminal** and navigate to the frontend directory:

```powershell
cd "C:\path\to\FitSaathi AI\frontend"
```

Install dependencies:

```powershell
npm install
```

Create the frontend environment file:

```powershell
Copy-Item .env.example .env
```

Open `frontend/.env` and configure the backend API URL:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Start the frontend development server:

```powershell
npm run dev
```

The frontend will be available at:

`http://localhost:5173/`

> Keep both backend and frontend development servers running in separate terminals.

## 🔐 Environment Configuration

The project uses separate environment files for the frontend and backend.

- `backend/.env.example` — Backend environment variable template.
- `frontend/.env.example` — Frontend environment variable template.
- `backend/.env` and `frontend/.env` — Local configuration files containing environment-specific values.

Never commit actual `.env` files or expose API keys, database passwords, or Django secret keys.

For production, configure secure environment variables through your hosting provider. Set `DJANGO_DEBUG=False`, a strong `DJANGO_SECRET_KEY`, production `DJANGO_ALLOWED_HOSTS`, database credentials, CORS and CSRF trusted origins, and the appropriate frontend API URL.

Refer to the backend and frontend README files for additional configuration details.

## 🧪 Testing

### Frontend

Run these commands from the `frontend` directory:

```bash
npm run build
npm run test:run
npm run lint
```

### Backend

Run these commands from the `backend` directory with the Python virtual environment activated:

```bash
python manage.py check
python manage.py test api
```

## 🚀 Deployment Preparation

Before deploying:

- Configure production environment variables.
- Use a production PostgreSQL database.
- Set `DJANGO_DEBUG=False`.
- Configure allowed hosts, CORS, and CSRF trusted origins.
- Configure the frontend API base URL.
- Use HTTPS for production.
- Keep secret keys and API credentials outside source control.
- Run migrations against the production database.
- Verify authentication, API connectivity, and privacy-related functionality.

Deployment-specific instructions depend on the selected hosting providers.

## ⚠️ Disclaimer

FitSaathi AI is intended for general fitness and wellness guidance. It is not a substitute for professional medical advice, diagnosis, or treatment.

## 👨‍💻 Developer

**Ziyan Khan**

GitHub: [@Ziyankhan2801](https://github.com/Ziyankhan2801)

---

Made with ❤️ for a healthier lifestyle.