
import {
  Activity,
  BarChart3,
  CalendarDays,
  ClipboardList,
  Dumbbell,
  HeartPulse,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Utensils,
  X,
  BookOpen,
  BrainCircuit,
  ScanFace,
} from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'

const navigationItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'My Workouts', icon: Dumbbell, href: '/dashboard/workouts' },
  { label: 'Exercise Library', icon: BookOpen, href: '/dashboard/exercise-library' },
  { label: 'Workout History', icon: ClipboardList, href: '/dashboard/workout-history' },
  { label: 'Progress', icon: BarChart3, href: '/dashboard/progress' },
  { label: 'AI Fitness Coach', icon: BrainCircuit, href: '/dashboard/ai-coach' },
  { label: 'AI Camera Coach', icon: ScanFace, href: '/dashboard/camera-coach' },
  { label: 'Nutrition', icon: Utensils, href: '/dashboard/nutrition' },
  { label: 'My Schedule', icon: CalendarDays, href: '/dashboard/schedule' },
]

type SidebarProps = {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-[#141712] transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <Link to="/" onClick={onClose} className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c5f66a] text-[#10120f]">
              <Activity size={23} strokeWidth={2.5} />
            </span>

            <span className="text-lg font-bold tracking-tight text-white">
              FitSaathi<span className="text-[#c5f66a]">.ai</span>
            </span>
          </Link>

          <button
            type="button"
            aria-label="Close sidebar"
            onClick={onClose}
            className="rounded-lg p-2 text-white/60 hover:bg-white/5 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pb-3 pt-8">
          <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
            Your space
          </p>
        </div>

        <nav
          aria-label="Main navigation"
          className="flex-1 space-y-1 overflow-y-auto px-4"
        >
          {navigationItems.map(({ label, icon: Icon, href }) => (
            <NavLink
              key={href}
              to={href}
              end={href === '/dashboard'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-[#c5f66a]/10 text-[#c5f66a]'
                    : 'text-white/55 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mx-4 mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#c5f66a]/10 text-[#c5f66a]">
            <HeartPulse size={19} />
          </div>

          <p className="text-sm font-semibold text-white">Small steps matter.</p>
          <p className="mt-1 text-xs leading-5 text-white/45">
            Build healthy habits at your own pace.
          </p>
        </div>

        <div className="border-t border-white/10 p-4">
          <NavLink
            to="/dashboard/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                isActive
                  ? 'bg-[#c5f66a]/10 text-[#c5f66a]'
                  : 'text-white/55 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Settings size={19} />
            Settings
          </NavLink>

          <div className="mt-2 flex items-center gap-3 px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70">
              <ShieldCheck size={19} />
            </span>

            <div>
              <p className="text-sm font-medium text-white/80">Your privacy</p>
              <p className="mt-1 text-xs text-white/40">
                Your journey, your control
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
