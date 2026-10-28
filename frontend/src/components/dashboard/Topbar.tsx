
import { Bell, Menu, Search, UserRound } from 'lucide-react'

type TopbarProps = {
  onMenuClick: () => void
}

export default function Topbar({ onMenuClick }: TopbarProps) {
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

        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c5f66a]/20 bg-[#c5f66a]/10 text-[#c5f66a]">
          <UserRound size={20} />
        </div>
      </div>
    </header>
  )
}
