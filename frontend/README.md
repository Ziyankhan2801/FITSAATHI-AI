# FitSaathi AI – Frontend

The React and TypeScript frontend for FitSaathi AI, an AI-powered home fitness coaching application.

## Tech Stack

- React 19
- TypeScript
- Vite 8
- Tailwind CSS 4
- React Router
- Lucide React
- MediaPipe Tasks Vision
- React Markdown
- Vitest
- React Testing Library
- Oxlint

## Features

- Responsive fitness dashboard
- User authentication and account management
- Personalized workout experience
- Workout Studio
- AI Fitness Coach
- Camera-based exercise guidance using MediaPipe
- Nutrition tracking
- Workout scheduling
- Progress monitoring
- Privacy and application settings

## Getting Started

### Prerequisites

- Node.js 24+
- npm

### 1. Navigate to frontend

Run from the project root:

```powershell
cd frontend
```

### 2. Install dependencies

```powershell
npm install
```

### 3. Configure environment variables

Create your local environment file using the example template:

```powershell
Copy-Item .env.example .env
```

Configure the backend API URL in `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

For production, replace the local URL with your deployed backend API URL:

```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

Restart the Vite development server after changing environment variables.

**Security note:** Frontend variables prefixed with `VITE_` are exposed to the browser. Never store secret keys, passwords, or private API credentials in frontend environment variables.

### 4. Start development server

```powershell
npm run dev
```

Open the application at:

http://localhost:5173/

Make sure the Django backend is also running.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | TypeScript checks and production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run Oxlint |
| `npm run test` | Start Vitest |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage |

## Testing

Run all frontend tests:

```powershell
npm run test:run
```

Run lint checks:

```powershell
npm run lint
```

Create a production build:

```powershell
npm run build
```

Production output is generated in the `dist/` directory.

## Camera Coach Requirements

The Camera Coach uses MediaPipe Tasks Vision for pose detection.

- Camera access requires browser permission and a secure context.
- Use localhost during local development and HTTPS in production.
- Camera functionality depends on compatible browser and device support.

## Backend Integration

The frontend communicates with the Django REST Framework backend.

Ensure that:

- The Django backend is running.
- `VITE_API_BASE_URL` points to the correct backend API URL.
- Backend CORS and CSRF settings allow the frontend origin.
- Production frontend and backend URLs are configured correctly.

Refer to the root and backend README files for backend setup and configuration instructions.

## Project Structure

```text
frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── context/
│   ├── layouts/
│   ├── pages/
│   ├── routes/
│   └── test/
├── .env.example
├── package.json
├── package-lock.json
├── vite.config.ts
└── README.md
```

## Production Build

Run:

```powershell
npm run build
```

The optimized production files will be available inside `dist/`.

Before deployment, configure the production API URL and ensure the backend is accessible over HTTPS.

## Developer

**Ziyan Khan**

GitHub: [@Ziyankhan2801](https://github.com/Ziyankhan2801)

---

Made with ❤️ for a healthier lifestyle.