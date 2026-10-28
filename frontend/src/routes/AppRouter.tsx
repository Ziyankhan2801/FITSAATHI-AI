
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import App from '../App'
import DashboardHome from '../pages/dashboard/DashboardHome'
import NotFound from '../pages/NotFound'
import PlaceholderPage from '../pages/dashboard/PlaceholderPage'
import DashboardLayout from '../layouts/DashboardLayout'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />

        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />

          <Route
            path="workouts"
            element={
              <PlaceholderPage
                title="My Workouts"
                description="Your personalised home workout plans and exercise sessions will live here."
              />
            }
          />

          <Route
            path="progress"
            element={
              <PlaceholderPage
                title="Your Progress"
                description="Track your fitness journey, completed workouts and improvements here once progress tracking is implemented."
              />
            }
          />

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
            element={
              <PlaceholderPage
                title="Fitness Assessment"
                description="A personalised assessment will help establish your goals, experience and starting point."
              />
            }
          />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
