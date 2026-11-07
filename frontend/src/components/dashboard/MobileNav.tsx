
import { useState } from 'react'
import {
  BarChart3,
  Dumbbell,
  LayoutDashboard,
  BookOpen,
  BrainCircuit,
  ScanFace,
  MoreHorizontal,
  X,
  CalendarDays,
  History,
  Apple,
  Settings,
  ClipboardCheck,
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'

const mobileItems = [
  { label: 'Home', icon: LayoutDashboard, to: '/dashboard', end: true },
  { label: 'Workouts', icon: Dumbbell, to: '/dashboard/workouts', end: false },
  { label: 'Exercises', icon: BookOpen, to: '/dashboard/exercise-library', end: false },
  { label: 'Progress', icon: BarChart3, to: '/dashboard/progress', end: false },
  { label: 'AI Coach', icon: BrainCircuit, to: '/dashboard/ai-coach', end: false },
  { label: 'More', icon: MoreHorizontal, to: '#more', end: false },
]

const moreItems = [
  { label: 'AI Camera Coach', icon: ScanFace, to: '/dashboard/camera-coach' },
  { label: 'Nutrition', icon: Apple, to: '/dashboard/nutrition' },
  { label: 'Workout History', icon: History, to: '/dashboard/workout-history' },
  { label: 'My Schedule', icon: CalendarDays, to: '/dashboard/schedule' },
  { label: 'Fitness Assessment', icon: ClipboardCheck, to: '/dashboard/assessment' },
  { label: 'Settings', icon: Settings, to: '/dashboard/settings' },
]

export default function MobileNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()

  const moreActive = moreItems.some((item) =>
    location.pathname === item.to
  )

  return (
    <>
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {moreOpen && (
        <div className="fixed inset-x-3 bottom-20 z-50 rounded-2xl border border-white/10 bg-[#171a15] p-4 shadow-2xl lg:hidden">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">More sections</h3>
              <p className="mt-1 text-xs text-white/40">
                Explore all FitSaathi features
              </p>
            </div>

            <button
              onClick={() => setMoreOpen(false)}
              aria-label="Close menu"
              className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"
            >
              <X size={19} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {moreItems.map(({ label, icon: Icon, to }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl border p-3 text-sm transition ${
                    isActive
                      ? 'border-[#c5f66a]/30 bg-[#c5f66a]/10 text-[#c5f66a]'
                      : 'border-white/5 bg-white/[0.03] text-white/65 hover:bg-white/10'
                  }`
                }
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}

      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-white/10 bg-[#141712]/95 px-1 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-xl lg:hidden"
      >
        {mobileItems.map(({ label, icon: Icon, to, end }) => {
          if (label === 'More') {
            return (
              <button
                key={to}
                type="button"
                onClick={() => setMoreOpen((current) => !current)}
                aria-expanded={moreOpen}
                aria-label="More navigation options"
                className={`flex flex-col items-center gap-1 rounded-xl px-0.5 py-2 text-[10px] font-medium transition ${
                  moreOpen || moreActive
                    ? 'text-[#c5f66a]'
                    : 'text-white/45 hover:text-white/80'
                }`}
              >
                <Icon size={19} />
                <span>More</span>
              </button>
            )
          }

          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMoreOpen(false)}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-xl px-0.5 py-2 text-[10px] font-medium transition ${
                  isActive
                    ? 'text-[#c5f66a]'
                    : 'text-white/45 hover:text-white/80'
                }`
              }
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          )
        })}
      </nav>
    </>
  )
}
