
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import App from '../App'
import DashboardHome from '../pages/dashboard/DashboardHome'
import FitnessAssessment from '../pages/dashboard/FitnessAssessment'
import MyWorkouts from '../pages/dashboard/MyWorkouts'
import WorkoutHistory from '../pages/dashboard/WorkoutHistory'
import Progress from '../pages/dashboard/Progress'
import ExerciseLibrary from '../pages/dashboard/ExerciseLibrary'
import PlaceholderPage from '../pages/dashboard/PlaceholderPage'
import NotFound from '../pages/NotFound'

import DashboardLayout from '../layouts/DashboardLayout'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'

import ProtectedRoute from './ProtectedRoute'
import { AuthProvider } from '../context/AuthContext'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected dashboard routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />

              <Route path="workouts" element={<MyWorkouts />} />

              <Route
                path="exercise-library"
                element={<ExerciseLibrary />}
              />

              <Route
                path="workout-history"
                element={<WorkoutHistory />}
              />

              <Route path="progress" element={<Progress />} />

              <Route
                path="nutrition"
                element={
                  <PlaceholderPage
                    title="Nutrition Coach"
                    description="Your personalised nutrition guidance and Indian-food-friendly meal planning will be developed here."
                  />
                }
              />

              <Route
                path="schedule"
                element={
                  <PlaceholderPage
                    title="My Schedule"
                    description="Plan your workout days and build a routine that fits your lifestyle."
                  />
                }
              />

              <Route
                path="settings"
                element={
                  <PlaceholderPage
                    title="Settings"
                    description="Account preferences, privacy controls and personal fitness settings will be added here."
                  />
                }
              />

              <Route
                path="assessment"
                element={<FitnessAssessment />}
              />
            </Route>
          </Route>

          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
