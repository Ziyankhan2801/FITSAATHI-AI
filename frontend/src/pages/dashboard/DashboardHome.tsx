
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Dumbbell,
  Flame,
  HeartPulse,
  Target,
  LoaderCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  checkBackendHealth,
  getFitnessProfile,
  getWorkoutHistory,
  type FitnessProfile,
  type WorkoutHistory as WorkoutHistoryRecord,
} from '../../services/api'

type BackendStatus = 'checking' | 'connected' | 'error'

const weeklyDays = [
  { day: 'Mon' },
  { day: 'Tue' },
  { day: 'Wed' },
  { day: 'Thu' },
  { day: 'Fri' },
  { day: 'Sat' },
  { day: 'Sun' },
]

function isAssessmentComplete(profile: FitnessProfile): boolean {
  return Boolean(
    profile.fitness_goal &&
      profile.experience_level &&
      profile.height_cm !== null &&
      profile.weight_kg !== null &&
      profile.workout_days_per_week !== null &&
      profile.workout_minutes !== null &&
      profile.equipment_level &&
      profile.dietary_preference &&
      profile.has_health_limitation !== null,
  )
}

function formatGoal(goal: string): string {
  const goals: Record<string, string> = {
    weight_loss: 'Weight loss',
    muscle_gain: 'Muscle gain',
    general_fitness: 'General fitness',
    stamina: 'Improve stamina',
    flexibility: 'Flexibility',
  }

  return goals[goal] ?? 'Not selected'
}

function formatEquipment(equipment: string): string {
  const options: Record<string, string> = {
    none: 'No equipment',
    basic: 'Basic equipment',
    home_gym: 'Home gym',
  }

  return options[equipment] ?? 'Not selected'
}

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export default function DashboardHome() {
  const [backendStatus, setBackendStatus] =
    useState<BackendStatus>('checking')
  const [backendMessage, setBackendMessage] = useState(
    'Checking backend connection...',
  )

  const [profile, setProfile] = useState<FitnessProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState('')

  const [workoutHistory, setWorkoutHistory] = useState<
    WorkoutHistoryRecord[]
  >([])
  const [workoutLoading, setWorkoutLoading] = useState(true)
  const [workoutError, setWorkoutError] = useState('')

  useEffect(() => {
    let active = true

    checkBackendHealth()
      .then((data) => {
        if (active) {
          setBackendStatus('connected')
          setBackendMessage(data.message)
        }
      })
      .catch(() => {
        if (active) {
          setBackendStatus('error')
          setBackendMessage('Backend connection failed.')
        }
      })

    getFitnessProfile()
      .then((data) => {
        if (active) {
          setProfile(data)
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setProfileError(
            err instanceof Error
              ? err.message
              : 'Could not load your fitness profile.',
          )
        }
      })
      .finally(() => {
        if (active) {
          setProfileLoading(false)
        }
      })

    getWorkoutHistory()
      .then((data) => {
        if (active) {
          setWorkoutHistory(data)
          setWorkoutError('')
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setWorkoutError(
            err instanceof Error
              ? err.message
              : 'Could not load your workout history.',
          )
        }
      })
      .finally(() => {
        if (active) {
          setWorkoutLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  const assessmentComplete = profile
    ? isAssessmentComplete(profile)
    : false

  // Each history record represents one completed workout on a saved date.
  const completedWorkouts = workoutHistory.length

  const totalExercisesCompleted = workoutHistory.reduce(
    (total, session) => total + session.completed_exercises.length,
    0,
  )

  const completedDateKeys = new Set(
    workoutHistory.map((session) => session.workout_date),
  )

  const today = new Date()
  const todayKey = getLocalDateKey(today)

  // Build the current Monday-to-Sunday activity view.
  const mondayOffset = (today.getDay() + 6) % 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - mondayOffset)
  monday.setHours(0, 0, 0, 0)

  const weeklyActivity = weeklyDays.map(({ day }, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)

    const dateKey = getLocalDateKey(date)

    const sessions = workoutHistory.filter(
      (session) => session.workout_date === dateKey,
    )

    return {
      day,
      date,
      sessionCount: sessions.length,
      exerciseCount: sessions.reduce(
        (total, session) => total + session.completed_exercises.length,
        0,
      ),
    }
  })

  // Continue the streak from today if active, otherwise from yesterday.
  const streakStart = new Date(today)
  streakStart.setHours(0, 0, 0, 0)

  if (!completedDateKeys.has(todayKey)) {
    streakStart.setDate(streakStart.getDate() - 1)
  }

  let currentStreak = 0

  for (let i = 0; i < 366; i++) {
    const date = new Date(streakStart)
    date.setDate(streakStart.getDate() - i)

    if (!completedDateKeys.has(getLocalDateKey(date))) {
      break
    }

    currentStreak++
  }

  const overviewItems = [
    {
      label: 'Workouts completed',
      value: workoutLoading
        ? '—'
        : workoutError
          ? '—'
          : String(completedWorkouts),
      detail: workoutLoading
        ? 'Loading workout data...'
        : workoutError
          ? 'Workout data unavailable'
          : `${completedWorkouts} completed history records`,
      icon: Dumbbell,
    },
    {
      label: 'Exercises completed',
      value: workoutLoading
        ? '—'
        : workoutError
          ? '—'
          : String(totalExercisesCompleted),
      detail: workoutLoading
        ? 'Loading workout data...'
        : workoutError
          ? 'Workout data unavailable'
          : 'Total exercises across completed workouts',
      icon: Clock3,
    },
    {
      label: 'Current streak',
      value:
        workoutLoading || workoutError
          ? '—'
          : `${currentStreak} ${currentStreak === 1 ? 'day' : 'days'}`,
      detail: workoutLoading
        ? 'Calculating your streak...'
        : workoutError
          ? 'Workout data unavailable'
          : currentStreak > 0
            ? 'Consecutive days with a completed workout'
            : 'Complete a workout to start your streak',
      icon: Flame,
    },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section
        aria-live="polite"
        className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#171a15] p-4"
      >
        <span
          className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
            backendStatus === 'connected'
              ? 'bg-[#c5f66a]'
              : backendStatus === 'error'
                ? 'bg-red-400'
                : 'bg-yellow-400'
          }`}
        />

        <div>
          <p className="text-sm font-semibold">
            Backend:{' '}
            {backendStatus === 'connected'
              ? 'Connected'
              : backendStatus === 'error'
                ? 'Disconnected'
                : 'Checking...'}
          </p>
          <p className="mt-1 text-xs text-white/50">{backendMessage}</p>
        </div>
      </section>

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
            {weeklyActivity.map(
              ({ day, date, sessionCount, exerciseCount }) => {
                const hasActivity = sessionCount > 0
                const isToday =
                  date.toDateString() === new Date().toDateString()

                return (
                  <div key={day} className="min-w-0 text-center">
                    <div
                      title={`${date.toLocaleDateString()} · ${sessionCount} completed workouts · ${exerciseCount} exercises`}
                      className={`mx-auto flex aspect-square max-w-12 items-center justify-center rounded-xl border ${
                        hasActivity
                          ? 'border-[#c5f66a]/40 bg-[#c5f66a]/15 text-[#c5f66a]'
                          : isToday
                            ? 'border-white/25 bg-white/[0.06] text-white/60'
                            : 'border-white/10 bg-white/[0.03] text-white/35'
                      }`}
                    >
                      <span className="text-xs font-semibold">
                        {hasActivity ? exerciseCount : '—'}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-white/45">{day}</p>
                  </div>
                )
              },
            )}
          </div>

          <p className="mt-6 text-xs leading-5 text-white/40">
            {workoutLoading
              ? 'Loading your workout activity...'
              : workoutError
                ? 'Workout activity could not be loaded.'
                : 'Numbers show exercises from completed history records for each date.'}
          </p>

          <Link
            to="/dashboard/workout-history"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#c5f66a] transition hover:text-[#d6ff8c]"
          >
            View workout history <ArrowRight size={16} />
          </Link>
        </article>

        <article className="rounded-2xl border border-[#c5f66a]/15 bg-gradient-to-br from-[#c5f66a]/10 to-transparent p-5 sm:p-7">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#c5f66a]/10 text-[#c5f66a]">
            <Target size={22} />
          </span>

          {profileLoading ? (
            <>
              <h3 className="mt-5 text-xl font-semibold">
                Loading your assessment
              </h3>

              <LoaderCircle
                className="mt-4 animate-spin text-[#c5f66a]"
                size={20}
              />
            </>
          ) : profileError ? (
            <>
              <h3 className="mt-5 text-xl font-semibold">
                Assessment unavailable
              </h3>

              <p role="alert" className="mt-3 text-sm leading-6 text-white/55">
                {profileError}
              </p>

              <Link
                to="/dashboard/assessment"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#c5f66a]"
              >
                Open assessment <ArrowRight size={17} />
              </Link>
            </>
          ) : (
            <>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-semibold">
                  {assessmentComplete
                    ? 'Assessment completed'
                    : 'Complete your assessment'}
                </h3>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    assessmentComplete
                      ? 'bg-[#c5f66a]/15 text-[#c5f66a]'
                      : 'bg-yellow-400/10 text-yellow-300'
                  }`}
                >
                  {assessmentComplete ? 'Completed' : 'Pending'}
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-white/55">
                {assessmentComplete
                  ? 'Your saved fitness details are ready to personalise your journey.'
                  : 'Fill in the required details so your fitness plan can be tailored to you.'}
              </p>

              {profile && (
                <div className="mt-5 space-y-3 rounded-xl border border-white/10 bg-[#10120f]/60 p-4 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-white/45">Fitness goal</span>
                    <span className="text-right font-medium">
                      {formatGoal(profile.fitness_goal)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-white/45">Height</span>
                    <span className="font-medium">
                      {profile.height_cm !== null
                        ? `${profile.height_cm} cm`
                        : 'Not set'}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-white/45">Weight</span>
                    <span className="font-medium">
                      {profile.weight_kg !== null
                        ? `${profile.weight_kg} kg`
                        : 'Not set'}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-white/45">Workout routine</span>
                    <span className="text-right font-medium">
                      {profile.workout_days_per_week !== null &&
                      profile.workout_minutes !== null
                        ? `${profile.workout_days_per_week} days · ${profile.workout_minutes} min`
                        : 'Not set'}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-white/45">Equipment</span>
                    <span className="text-right font-medium">
                      {formatEquipment(profile.equipment_level)}
                    </span>
                  </div>
                </div>
              )}

              <Link
                to="/dashboard/assessment"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#c5f66a] transition hover:text-[#d6ff8c]"
              >
                {assessmentComplete ? 'Edit assessment' : 'Complete assessment'}
                <ArrowRight size={17} />
              </Link>
            </>
          )}
        </article>
      </section>

      {workoutError && (
        <p role="alert" className="text-sm text-red-300">
          Workout data could not be loaded: {workoutError}
        </p>
      )}

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
