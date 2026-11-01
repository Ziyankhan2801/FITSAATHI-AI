
import { Bell, LogOut, Menu, Search, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { logoutUser } from '../../services/api'

type TopbarProps = {
  onMenuClick: () => void
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')

  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  async function handleLogout() {
    setIsLoggingOut(true)
    setLogoutError('')

    try {
      await logoutUser()

      // Clear the global authentication state.
      await refreshUser()

      setIsProfileOpen(false)

      navigate('/login', { replace: true })
    } catch {
      setLogoutError('Logout failed. Please try again.')
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-4 border-b border-white/10 bg-[#10120f]/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
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
          <p className="text-xs text-white/40">Welcome to FitSaathi</p>
          <h1 className="mt-1 truncate text-lg font-semibold text-white sm:text-xl">
            Your dashboard
          </h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <button
          type="button"
          aria-label="Search"
          className="hidden rounded-xl border border-white/10 p-3 text-white/60 transition hover:bg-white/5 sm:inline-flex"
        >
          <Search size={19} />
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-xl border border-white/10 p-3 text-white/60 transition hover:bg-white/5"
        >
          <Bell size={19} />
          <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-[#c5f66a]" />
        </button>

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
            <div className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-white/10 bg-[#171a15] p-3 shadow-xl">
              <p className="px-2 py-2 text-sm font-semibold text-white">
                Your account
              </p>

              {logoutError && (
                <p role="alert" className="px-2 py-2 text-xs text-red-400">
                  {logoutError}
                </p>
              )}

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-sm text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogOut size={17} />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
