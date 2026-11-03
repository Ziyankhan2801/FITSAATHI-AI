
import {
  BarChart3,
  Dumbbell,
  LayoutDashboard,
  BookOpen,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const mobileItems = [
  { label: 'Home', icon: LayoutDashboard, to: '/dashboard', end: true },
  { label: 'Workouts', icon: Dumbbell, to: '/dashboard/workouts', end: false },
  { label: 'Exercises', icon: BookOpen, to: '/dashboard/exercise-library', end: false },
  { label: 'Progress', icon: BarChart3, to: '/dashboard/progress', end: false },
]

export default function MobileNav() {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-white/10 bg-[#141712]/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-xl lg:hidden"
    >
      {mobileItems.map(({ label, icon: Icon, to, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-medium transition ${
              isActive
                ? 'text-[#c5f66a]'
                : 'text-white/45 hover:text-white/80'
            }`
          }
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
