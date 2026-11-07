
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Dumbbell,
  LoaderCircle,
  Moon,
  Save,
  Target,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  getFitnessProfile,
  getWorkoutHistory,
  getWorkoutSessions,
  updateFitnessProfile,
  type FitnessProfile,
  type FitnessProfileUpdate,
  type WorkoutHistory,
  type WorkoutSession,
} from '../../services/api'

const DAYS = [
  { short: 'Mon', full: 'Monday' },
  { short: 'Tue', full: 'Tuesday' },
  { short: 'Wed', full: 'Wednesday' },
  { short: 'Thu', full: 'Thursday' },
  { short: 'Fri', full: 'Friday' },
  { short: 'Sat', full: 'Saturday' },
  { short: 'Sun', full: 'Sunday' },
]

type Status = 'completed' | 'in-progress' | 'missed' | 'planned' | 'rest'

const statusClass: Record<Status, string> = {
  completed: 'border-[#c5f66a]/30 bg-[#c5f66a]/10 text-[#c5f66a]',
  'in-progress': 'border-sky-400/30 bg-sky-400/10 text-sky-300',
  missed: 'border-red-400/25 bg-red-400/10 text-red-300',
  planned: 'border-white/10 bg-white/[0.03] text-white/65',
  rest: 'border-white/5 bg-[#10120f] text-white/35',
}

const statusLabel: Record<Status, string> = {
  completed: 'Completed',
  'in-progress': 'In progress',
  missed: 'Missed',
  planned: 'Planned',
  rest: 'Rest day',
}

function keyOf(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function mondayOf(date: Date) {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7))
  return result
}

function plusDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function spreadDays(count: number) {
  if (count < 1 || count > 7) return []
  return Array.from({ length: count }, (_, i) => Math.round(i * 7 / count))
}

function statusFor(
  date: Date,
  planned: boolean,
  completed: Set<string>,
  sessions: Map<string, WorkoutSession>,
  today: string,
): Status {
  if (!planned) return 'rest'

  const key = keyOf(date)

  if (completed.has(key) || (sessions.get(key)?.completion_percentage ?? 0) >= 100) {
    return 'completed'
  }

  if ((sessions.get(key)?.completion_percentage ?? 0) > 0) {
    return 'in-progress'
  }

  return key < today ? 'missed' : 'planned'
}

export default function Schedule() {
  const [profile, setProfile] = useState<FitnessProfile | null>(null)
  const [history, setHistory] = useState<WorkoutHistory[]>([])
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [selected, setSelected] = useState<number[]>([])

  const [today, setToday] = useState(() => keyOf(new Date()))
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()))

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [p, h, s] = await Promise.all([
        getFitnessProfile(),
        getWorkoutHistory(),
        getWorkoutSessions(),
      ])

      setProfile(p)
      setHistory(h)
      setSessions(s)
      setSelected(
        p.workout_weekdays?.length
          ? p.workout_weekdays
          : spreadDays(p.workout_days_per_week ?? 3),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your schedule.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadInitialSchedule() {
      try {
        const [p, h, s] = await Promise.all([
          getFitnessProfile(),
          getWorkoutHistory(),
          getWorkoutSessions(),
        ])

        if (!active) return

        setProfile(p)
        setHistory(h)
        setSessions(s)
        setSelected(
          p.workout_weekdays?.length
            ? p.workout_weekdays
            : spreadDays(p.workout_days_per_week ?? 3),
        )
      } catch (e) {
        if (active) {
          setError(
            e instanceof Error ? e.message : 'Could not load your schedule.',
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadInitialSchedule()

    return () => {
      active = false
    }
  }, [])

  const completed = useMemo(
    () => new Set(history.filter(x => x.completion_percentage >= 100).map(x => x.workout_date)),
    [history],
  )

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, WorkoutSession>()

    sessions.forEach(s => {
      if (
        s.workout_date &&
        (!map.has(s.workout_date) ||
          (map.get(s.workout_date)?.completion_percentage ?? 0) < s.completion_percentage)
      ) {
        map.set(s.workout_date, s)
      }
    })

    return map
  }, [sessions])

  const days = useMemo(
    () => DAYS.map((d, i) => ({ ...d, date: plusDays(weekStart, i) })),
    [weekStart],
  )

  const dueDays = days.filter((d, i) => selected.includes(i) && keyOf(d.date) <= today)

  const completedCount = dueDays.filter(
    d => statusFor(d.date, true, completed, sessionsByDate, today) === 'completed',
  ).length

  const percent = dueDays.length
    ? Math.round((completedCount / dueDays.length) * 100)
    : 0

  function toggle(index: number) {
    setSelected(current =>
      current.includes(index)
        ? current.filter(x => x !== index)
        : [...current, index].sort((a, b) => a - b),
    )
    setError('')
    setSuccess('')
  }

  async function save() {
    if (!profile) return

    if (!selected.length) {
      setError('Select at least one workout day.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const {
        id: _id,
        age: _age,
        created_at: _created,
        updated_at: _updated,
        ...rest
      } = profile

      const payload: FitnessProfileUpdate = {
        ...rest,
        workout_days_per_week: selected.length,
        workout_weekdays: [...selected].sort((a, b) => a - b),
      }

      const updated = await updateFitnessProfile(payload)

      setProfile(updated)
      setSelected(updated.workout_weekdays ?? selected)
      setSuccess('Your weekly schedule has been saved.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your schedule.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-3 text-white/60">
        <LoaderCircle className="animate-spin" size={20} />
        Loading your schedule...
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#171a15] p-6">
        <p>Could not load your fitness profile.</p>

        {error && <p className="mt-2 text-sm text-red-300">{error}</p>}

        <button
          onClick={() => void load()}
          className="mt-4 rounded-full bg-[#c5f66a] px-5 py-2 text-sm font-semibold text-black"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c5f66a]/10 text-[#c5f66a]">
          <CalendarDays size={24} />
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#c5f66a]">
          Stay consistent
        </p>

        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          My schedule
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
          Your routine loads from your fitness assessment. Choose your workout days and save your weekly plan.
        </p>

        <Link
          to="/dashboard/assessment"
          className="mt-3 inline-block text-sm text-[#c5f66a] hover:text-[#d6ff8c]"
        >
          Edit fitness assessment →
        </Link>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-xl border border-[#c5f66a]/20 bg-[#c5f66a]/10 p-4 text-sm text-[#d6ff8c]"
        >
          {success}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#171a15] p-5">
          <div className="flex items-center gap-2 text-sm text-white/50">
            <Target size={17} className="text-[#c5f66a]" />
            Weekly target
          </div>
          <p className="mt-3 text-3xl font-bold">
            {selected.length} <span className="text-base text-white/40">days</span>
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#171a15] p-5">
          <div className="flex items-center gap-2 text-sm text-white/50">
            <CheckCircle2 size={17} className="text-[#c5f66a]" />
            Completed this week
          </div>
          <p className="mt-3 text-3xl font-bold">
            {completedCount}
            <span className="text-base text-white/40"> / {dueDays.length}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#171a15] p-5">
          <div className="flex items-center gap-2 text-sm text-white/50">
            <Target size={17} className="text-[#c5f66a]" />
            Weekly completion
          </div>
          <p className="mt-3 text-3xl font-bold">{percent}%</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#c5f66a]"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#171a15] p-5 sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Choose workout days</h3>
            <p className="mt-1 text-sm text-white/45">
              Select 1–7 days. Unselected days become rest days.
            </p>
          </div>

          <button
            onClick={() => void save()}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#c5f66a] px-5 py-3 text-sm font-semibold text-[#10120f] disabled:opacity-60"
          >
            {saving ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}
            {saving ? 'Saving...' : 'Save schedule'}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {DAYS.map((d, i) => (
            <button
              key={d.short}
              type="button"
              aria-pressed={selected.includes(i)}
              onClick={() => toggle(i)}
              className={`rounded-xl border p-4 text-left transition ${
                selected.includes(i)
                  ? 'border-[#c5f66a]/50 bg-[#c5f66a]/10'
                  : 'border-white/10 bg-[#10120f] hover:border-white/25'
              }`}
            >
              <span
                className={`block text-sm font-semibold ${
                  selected.includes(i) ? 'text-[#c5f66a]' : 'text-white/75'
                }`}
              >
                {d.full}
              </span>

              <span className="mt-3 flex items-center gap-2 text-xs text-white/45">
                {selected.includes(i) ? <Dumbbell size={14} /> : <Moon size={14} />}
                {selected.includes(i) ? 'Workout' : 'Rest day'}
              </span>
            </button>
          ))}
        </div>

        <p className="mt-4 text-xs text-white/40">
          Saving also updates workout days per week in your Fitness Assessment.
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#171a15] p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Weekly calendar</h3>
            <p className="mt-1 text-sm text-white/45">
              {weekStart.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              })}{' '}
              –{' '}
              {plusDays(weekStart, 6).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              aria-label="Previous week"
              onClick={() => setWeekStart(x => plusDays(x, -7))}
              className="rounded-lg border border-white/10 p-2 text-white/70 hover:bg-white/5"
            >
              <ChevronLeft size={19} />
            </button>

            <button
              onClick={() => {
                const currentDate = new Date()
                setToday(keyOf(currentDate))
                setWeekStart(mondayOf(currentDate))
              }}
              className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/5"
            >
              Today
            </button>

            <button
              aria-label="Next week"
              onClick={() => setWeekStart(x => plusDays(x, 7))}
              className="rounded-lg border border-white/10 p-2 text-white/70 hover:bg-white/5"
            >
              <ChevronRight size={19} />
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {days.map((d, i) => {
            const key = keyOf(d.date)
            const status = statusFor(
              d.date,
              selected.includes(i),
              completed,
              sessionsByDate,
              today,
            )

            const historyItem = history.find(x => x.workout_date === key)
            const session = sessionsByDate.get(key)
            const title = historyItem?.workout_title || session?.workout_title

            return (
              <article
                key={key}
                className={`min-h-40 rounded-xl border p-4 ${statusClass[status]}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{d.short}</span>
                  <span className="text-xs opacity-65">
                    {d.date.toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>

                <div className="mt-5 flex items-center gap-2">
                  {status === 'completed' ? (
                    <CheckCircle2 size={17} />
                  ) : status === 'rest' ? (
                    <Moon size={17} />
                  ) : status === 'in-progress' || status === 'missed' ? (
                    <Clock3 size={17} />
                  ) : (
                    <Dumbbell size={17} />
                  )}

                  <span className="text-xs font-semibold">
                    {statusLabel[status]}
                  </span>
                </div>

                <p className="mt-3 text-xs opacity-65">
                  {status === 'rest'
                    ? 'Take time to recover.'
                    : title || (status === 'missed' ? 'No workout recorded' : 'Scheduled workout')}
                </p>

                {status === 'in-progress' && session && (
                  <p className="mt-2 text-[11px] opacity-60">
                    {session.completion_percentage}% complete
                  </p>
                )}
              </article>
            )
          })}
        </div>

        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/45">
          {(['completed', 'in-progress', 'planned', 'missed', 'rest'] as Status[]).map(s => (
            <span key={s} className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  s === 'completed'
                    ? 'bg-[#c5f66a]'
                    : s === 'in-progress'
                      ? 'bg-sky-300'
                      : s === 'missed'
                        ? 'bg-red-300'
                        : s === 'planned'
                          ? 'bg-white/50'
                          : 'bg-white/20'
                }`}
              />
              {statusLabel[s]}
            </span>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          to="/dashboard/workout-history"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm text-white/75 hover:bg-white/5"
        >
          <CalendarDays size={17} />
          View workout history
        </Link>

        <Link
          to="/dashboard/workout-studio"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c5f66a] px-5 py-3 text-sm font-semibold text-[#10120f] hover:bg-[#d6ff8c]"
        >
          <Dumbbell size={17} />
          Start a workout
        </Link>
      </div>
    </div>
  )
}
