
import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import DashboardLayout from '../layouts/DashboardLayout'
import ProtectedRoute from './ProtectedRoute'
import { AuthProvider } from '../context/AuthContext'

// Lazy-loaded pages
const App = lazy(() => import('../App'))

const Login = lazy(() => import('../pages/auth/Login'))
const Register = lazy(() => import('../pages/auth/Register'))
const ForgotPassword = lazy(
  () => import('../pages/auth/ForgotPassword'),
)
const ResetPassword = lazy(
  () => import('../pages/auth/ResetPassword'),
)
const NotFound = lazy(() => import('../pages/NotFound'))

const DashboardHome = lazy(
  () => import('../pages/dashboard/DashboardHome'),
)
const FitnessAssessment = lazy(
  () => import('../pages/dashboard/FitnessAssessment'),
)
const MyWorkouts = lazy(
  () => import('../pages/dashboard/MyWorkouts'),
)
const WorkoutStudio = lazy(
  () => import('../pages/dashboard/WorkoutStudio'),
)
const WorkoutHistory = lazy(
  () => import('../pages/dashboard/WorkoutHistory'),
)
const Progress = lazy(
  () => import('../pages/dashboard/Progress'),
)
const ExerciseLibrary = lazy(
  () => import('../pages/dashboard/ExerciseLibrary'),
)
const Schedule = lazy(
  () => import('../pages/dashboard/Schedule'),
)
const CameraCoach = lazy(
  () => import('../pages/dashboard/CameraCoach'),
)
const AICoach = lazy(
  () => import('../pages/dashboard/AICoach'),
)
const Nutrition = lazy(
  () => import('../pages/dashboard/Nutrition'),
)
const Settings = lazy(
  () => import('../pages/dashboard/Settings'),
)

// Route loading fallback
function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
        <p className="text-sm text-gray-500">
          Loading FitSaathi AI...
        </p>
      </div>
    </div>
  )
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
{/* Public Routes */}
<Route path="/" element={<App />} />
<Route path="/login" element={<Login />} />
<Route path="/register" element={<Register />} />
<Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Dashboard Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardHome />} />

                <Route path="workouts" element={<MyWorkouts />} />
                <Route
                  path="workout-studio"
                  element={<WorkoutStudio />}
                />
                <Route
                  path="exercise-library"
                  element={<ExerciseLibrary />}
                />
                <Route
                  path="workout-history"
                  element={<WorkoutHistory />}
                />
                <Route path="progress" element={<Progress />} />
                <Route path="schedule" element={<Schedule />} />

                <Route path="ai-coach" element={<AICoach />} />
                <Route path="camera-coach" element={<CameraCoach />} />

                <Route path="nutrition" element={<Nutrition />} />

                <Route path="settings" element={<Settings />} />
                <Route
                  path="assessment"
                  element={<FitnessAssessment />}
                />
              </Route>
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
