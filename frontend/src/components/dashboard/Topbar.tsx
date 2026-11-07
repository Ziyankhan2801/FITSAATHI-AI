
import {
  Bell,
  LogOut,
  Menu,
  Search,
  Settings,
  UserRound,
  Activity,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { logoutUser } from '../../services/api'

type TopbarProps = {
  onMenuClick: () => void
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')

  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()

  function navigateTo(path: string) {
    setIsProfileOpen(false)
    setLogoutError('')
    navigate(path)
  }

  async function handleLogout() {
    setIsLoggingOut(true)
    setLogoutError('')

    try {
      await logoutUser()
      await refreshUser()

      setIsProfileOpen(false)
      navigate('/login', { replace: true })
    } catch {
      setLogoutError('Logout failed. Please try again.')
      setIsLoggingOut(false)
    }
  }

  const displayName = user?.username || 'FitSaathi User'
  const displayEmail = user?.email || ''

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-4 border-b border-white/10 bg-[#10120f]/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      {/* Left section */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="rounded-xl border border-white/10 p-2.5 text-white/70 transition hover:bg-white/5 lg:hidden"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0">
          <p className="text-xs text-white/65">Welcome to FitSaathi</p>
          <h1 className="mt-1 truncate text-lg font-semibold text-white sm:text-xl">
            Your dashboard
          </h1>
        </div>
      </div>

      {/* Right section */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <button
          type="button"
          aria-label="Search"
          title="Search"
          className="hidden rounded-xl border border-white/10 p-3 text-white/60 transition hover:bg-white/5 sm:inline-flex"
        >
          <Search size={19} />
        </button>

        <button
          type="button"
          aria-label="Notifications"
          title="Notifications"
          className="relative rounded-xl border border-white/10 p-3 text-white/60 transition hover:bg-white/5"
        >
          <Bell size={19} />
          <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-[#c5f66a]" />
        </button>

        {/* Profile menu */}
        <div className="relative">
          <button
            type="button"
            aria-label="Open profile menu"
            aria-expanded={isProfileOpen}
            onClick={() => {
              setIsProfileOpen((open) => !open)
              setLogoutError('')
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c5f66a]/20 bg-[#c5f66a]/10 text-[#c5f66a] transition hover:bg-[#c5f66a]/20"
          >
            <UserRound size={20} />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-white/10 bg-[#171a15] p-3 shadow-xl">
              {/* User details */}
              <div className="border-b border-white/10 px-2 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#c5f66a]/10 text-[#c5f66a]">
                    <UserRound size={20} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {displayName}
                    </p>

                    {displayEmail && (
                      <p className="truncate text-xs text-white/65">
                        {displayEmail}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation options */}
              <div className="space-y-1 py-2">
                <button
                  type="button"
                  onClick={() => navigateTo('/dashboard/settings')}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
                >
                  <Settings size={17} />
                  Settings
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('/dashboard/assessment')}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
                >
                  <Activity size={17} />
                  Fitness Assessment
                </button>
              </div>

              {/* Logout error */}
              {logoutError && (
                <p role="alert" className="px-2 py-2 text-xs text-red-400">
                  {logoutError}
                </p>
              )}

              {/* Logout */}
              <div className="border-t border-white/10 pt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <LogOut size={17} />
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
