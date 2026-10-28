
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Flame,
  HeartPulse,
  Target,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const overviewItems = [
  {
    label: 'Workouts completed',
    value: '0',
    detail: 'Your journey starts here',
    icon: Dumbbell,
  },
  {
    label: 'Active minutes',
    value: '0',
    detail: 'Every minute counts',
    icon: Clock3,
  },
  {
    label: 'Current streak',
    value: '0 days',
    detail: 'Build a steady habit',
    icon: Flame,
  },
]

const weeklyDays = [
  { day: 'Mon', active: false },
  { day: 'Tue', active: false },
  { day: 'Wed', active: false },
  { day: 'Thu', active: false },
  { day: 'Fri', active: false },
  { day: 'Sat', active: false },
  { day: 'Sun', active: false },
]

export default function DashboardHome() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-[#c5f66a]">
            YOUR FITNESS SPACE
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            One step at a time.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/50 sm:text-base">
            No gym required. Start where you are and build habits that work
            for your life.
          </p>
        </div>

        <Link
          to="/dashboard/workouts"
          className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-[#c5f66a] px-5 py-3 text-sm font-semibold text-[#10120f] transition hover:bg-[#d6ff8c] sm:self-auto"
        >
          Explore workouts
          <ArrowRight size={17} />
        </Link>
      </section>

      <section
        aria-label="Fitness overview"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {overviewItems.map(({ label, value, detail, icon: Icon }) => (
          <article
            key={label}
            className="rounded-2xl border border-white/10 bg-[#171a15] p-5 sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-white/50">{label}</p>
                <p className="mt-4 text-3xl font-bold tracking-tight">
                  {value}
                </p>
              </div>

              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#c5f66a]/10 text-[#c5f66a]">
                <Icon size={21} />
              </span>
            </div>

            <p className="mt-4 text-xs text-white/40">{detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <article className="rounded-2xl border border-white/10 bg-[#171a15] p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c5f66a]/10 text-[#c5f66a]">
              <CalendarDays size={20} />
            </span>

            <div>
              <h3 className="font-semibold">Your weekly activity</h3>
              <p className="mt-1 text-xs text-white/45">
                A fresh week to build your routine
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-7 gap-2">
            {weeklyDays.map(({ day, active }) => (
              <div key={day} className="text-center">
                <div
                  className={`mx-auto flex aspect-square max-w-12 items-center justify-center rounded-xl ${
                    active
                      ? 'bg-[#c5f66a] text-[#10120f]'
                      : 'border border-white/10 bg-white/[0.03] text-white/35'
                  }`}
                >
                  {active ? (
                    <CheckCircle2 size={19} />
                  ) : (
                    <span className="text-xs">—</span>
                  )}
                </div>
                <p className="mt-2 text-xs text-white/45">{day}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs leading-5 text-white/40">
            Your activity will appear here when workout tracking is connected.
          </p>
        </article>

        <article className="rounded-2xl border border-[#c5f66a]/15 bg-gradient-to-br from-[#c5f66a]/10 to-transparent p-5 sm:p-7">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#c5f66a]/10 text-[#c5f66a]">
            <Target size={22} />
          </span>

          <h3 className="mt-5 text-xl font-semibold">Let's personalise your plan</h3>

          <p className="mt-3 text-sm leading-6 text-white/55">
            Your goals, experience and available time will help shape a
            fitness routine around you.
          </p>

          <Link
            to="/dashboard/assessment"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#c5f66a] transition hover:text-[#d6ff8c]"
          >
            Start your assessment
            <ArrowRight size={17} />
          </Link>
        </article>
      </section>

      <section className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/65">
          <HeartPulse size={21} />
        </span>

        <div>
          <h3 className="font-semibold">Your pace. Your progress.</h3>
          <p className="mt-2 text-sm leading-6 text-white/45">
            Start gently, focus on proper form and rest when needed. Your plan
            should adapt to your abilities, not push you beyond them.
          </p>
        </div>
      </section>
    </div>
  )
}
