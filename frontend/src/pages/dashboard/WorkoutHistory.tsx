
import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Target,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import {
  getWorkoutHistory,
  type WorkoutHistory as WorkoutHistoryRecord,
} from '../../services/api'
import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'
import EmptyState from '../../components/common/EmptyState'

export default function WorkoutHistory() {
  const navigate = useNavigate()

  const [sessions, setSessions] = useState<WorkoutHistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadHistory = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await getWorkoutHistory()
      setSessions(data)
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load workout history.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function fetchHistory() {
      setLoading(true)
      setError('')

      try {
        const data = await getWorkoutHistory()

        if (active) {
          setSessions(data)
        }
      } catch (err: unknown) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load workout history.',
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void fetchHistory()

    return () => {
      active = false
    }
  }, [])

  const totalWorkouts = sessions.length

  const totalCompletedExercises = sessions.reduce(
    (total, session) => total + session.completed_exercises.length,
    0,
  )

  const averageCompletion = totalWorkouts
    ? Math.round(
        sessions.reduce(
          (total, session) => total + session.completion_percentage,
          0,
        ) / totalWorkouts,
      )
    : 0

  function formatDate(value: string) {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return value
    }

    return date.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  function formatWorkoutDate(value: string) {
    const date = new Date(`${value}T12:00:00`)

    if (Number.isNaN(date.getTime())) {
      return value
    }

    return date.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-[#c5f66a]"
      >
        <ArrowLeft size={17} />
        Back to dashboard
      </Link>

      <header>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c5f66a]/10 text-[#c5f66a]">
          <CalendarDays size={24} />
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#c5f66a]">
          Your fitness journey
        </p>

        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Workout history
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
          Review your completed workouts, saved exercises and progress over
          time.
        </p>
      </header>

      {loading ? (
        <LoadingState
          title="Loading workout history"
          description="Fetching your completed workout sessions..."
        />
      ) : error ? (
        <ErrorState
          title="Unable to load workout history"
          message={`${error} Check that you are logged in and the backend server is running.`}
          onRetry={loadHistory}
          retryLabel="Try again"
        />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#171a15] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/50">Completed workouts</p>
                <Dumbbell size={19} className="text-[#c5f66a]" />
              </div>
              <p className="mt-4 text-3xl font-bold">{totalWorkouts}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#171a15] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/50">Exercises completed</p>
                <CheckCircle2 size={19} className="text-[#c5f66a]" />
              </div>
              <p className="mt-4 text-3xl font-bold">
                {totalCompletedExercises}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#171a15] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/50">Average completion</p>
                <Target size={19} className="text-[#c5f66a]" />
              </div>
              <p className="mt-4 text-3xl font-bold">
                {averageCompletion}%
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold">Completed sessions</h3>
              <p className="mt-1 text-sm text-white/45">
                Each entry represents a workout completion saved in your
                history.
              </p>
            </div>

            {sessions.length === 0 ? (
              <EmptyState
                title="No completed workouts yet"
                description="Complete all exercises in a workout to create a history record."
                actionLabel="Go to my workouts"
                onAction={() => navigate('/dashboard/workouts')}
              />
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <article
                    key={session.id}
                    className="rounded-2xl border border-white/10 bg-[#171a15] p-5 sm:p-6"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#c5f66a]">
                          Day {session.workout_day}
                        </p>

                        <h4 className="mt-2 text-lg font-semibold">
                          {session.workout_title}
                        </h4>

                        <p className="mt-2 flex items-center gap-2 text-xs text-white/45">
                          <CalendarDays size={14} />
                          Workout date: {formatWorkoutDate(session.workout_date)}
                        </p>

                        <p className="mt-2 flex items-center gap-2 text-xs text-white/45">
                          <Clock3 size={14} />
                          Completed: {formatDate(session.completed_at)}
                        </p>
                      </div>

                      <div className="sm:text-right">
                        <p className="text-2xl font-bold text-[#c5f66a]">
                          {session.completion_percentage}%
                        </p>
                        <p className="mt-1 text-xs text-white/45">
                          {session.completed_exercises.length} of{' '}
                          {session.total_exercises} exercises
                        </p>
                      </div>
                    </div>

                    <div
                      className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"
                      role="progressbar"
                      aria-valuenow={session.completion_percentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Day ${session.workout_day} completion`}
                    >
                      <div
                        className="h-full rounded-full bg-[#c5f66a] transition-all"
                        style={{
                          width: `${session.completion_percentage}%`,
                        }}
                      />
                    </div>

                    {session.completed_exercises.length > 0 && (
                      <div className="mt-5">
                        <p className="text-sm font-medium text-white/70">
                          Completed exercises
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {session.completed_exercises.map((exercise) => (
                            <span
                              key={exercise}
                              className="rounded-full border border-[#c5f66a]/20 bg-[#c5f66a]/5 px-3 py-1.5 text-xs text-[#c5f66a]"
                            >
                              {exercise}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          <p className="text-xs leading-5 text-white/40">
            Statistics are calculated from completed history records. Exercise
            counts reflect the saved checklist, not calories burned or actual
            exercise duration.
          </p>
        </>
      )}
    </div>
  )
}
