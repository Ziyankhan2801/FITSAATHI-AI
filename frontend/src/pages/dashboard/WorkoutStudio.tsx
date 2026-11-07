
import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Pause,
  Play,
  SkipForward,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import {
  createWorkoutSession,
  getWorkoutPlans,
  type WorkoutPlan,
} from '../../services/api'
import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'
import EmptyState from '../../components/common/EmptyState'

const clock = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

export default function WorkoutStudio() {
  const navigate = useNavigate()

  const [plans, setPlans] = useState<WorkoutPlan[]>([])
  const [planId, setPlanId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [started, setStarted] = useState(false)
  const [paused, setPaused] = useState(false)
  const [finished, setFinished] = useState(false)
  const [index, setIndex] = useState(0)
  const [setsDone, setSetsDone] = useState<Record<number, number>>({})
  const [elapsed, setElapsed] = useState(0)
  const [rest, setRest] = useState(0)
  const [saved, setSaved] = useState(false)

  const loadPlans = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await getWorkoutPlans()
      setPlans(data)

      setPlanId((currentId) => {
        if (currentId && data.some((plan) => String(plan.id) === currentId)) {
          return currentId
        }

        return data.length ? String(data[0].id) : ''
      })
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load workout plans.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial loading with cleanup.
  // Keep this separate so the retry callback remains available.
  useEffect(() => {
    let active = true

    async function fetchPlans() {
      try {
        const data = await getWorkoutPlans()

        if (!active) return

        setPlans(data)

        setPlanId((currentId) => {
          if (currentId && data.some((plan) => String(plan.id) === currentId)) {
            return currentId
          }

          return data.length ? String(data[0].id) : ''
        })
      } catch (err: unknown) {
        if (!active) return

        setError(
          err instanceof Error
            ? err.message
            : 'Could not load workout plans.',
        )
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void fetchPlans()

    return () => {
      active = false
    }
  }, [])

  // Workout duration timer.
  useEffect(() => {
    if (!started || paused || finished) return

    const id = window.setInterval(() => {
      setElapsed((value) => value + 1)
    }, 1000)

    return () => window.clearInterval(id)
  }, [started, paused, finished])

  // Rest timer.
  useEffect(() => {
    if (!started || paused || rest <= 0) return

    const id = window.setInterval(() => {
      setRest((value) => Math.max(0, value - 1))
    }, 1000)

    return () => window.clearInterval(id)
  }, [started, paused, rest])

  const plan = plans.find((p) => String(p.id) === planId)
  const exercises = plan?.planned_exercises ?? []
  const current = exercises[index]

  const doneNames = exercises
    .filter((exercise) => (setsDone[exercise.id] ?? 0) >= exercise.sets)
    .map((exercise) => exercise.exercise_name)

  const doneSets = exercises.reduce(
    (total, exercise) =>
      total + Math.min(setsDone[exercise.id] ?? 0, exercise.sets),
    0,
  )

  const totalSets = exercises.reduce(
    (total, exercise) => total + exercise.sets,
    0,
  )

  function start() {
    if (!plan || !exercises.length) return

    setStarted(true)
    setPaused(false)
    setFinished(false)
    setIndex(0)
    setSetsDone({})
    setElapsed(0)
    setRest(0)
    setSaved(false)
    setError('')
  }

  function completeSet() {
    if (!current || (setsDone[current.id] ?? 0) >= current.sets) return

    const next = (setsDone[current.id] ?? 0) + 1

    setSetsDone((value) => ({
      ...value,
      [current.id]: next,
    }))

    setRest(next < current.sets ? current.rest_seconds : 0)
  }

  async function finish() {
    if (!plan || saving) return

    setSaving(true)
    setError('')

    try {
      await createWorkoutSession({
        workout_day: plan.workout_day,
        workout_title: plan.title,
        completed_exercises: doneNames,
        total_exercises: exercises.length,
        completion_percentage: exercises.length
          ? Math.round((doneNames.length / exercises.length) * 100)
          : 0,
      })

      setStarted(false)
      setFinished(true)
      setSaved(true)
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not save workout session.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <Link
        to="/dashboard/workouts"
        className="inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-[#c5f66a]"
      >
        <ArrowLeft size={17} />
        Back to my workouts
      </Link>

      <header>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c5f66a]/10 text-[#c5f66a]">
          <Dumbbell size={24} />
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#c5f66a]">
          Training in progress
        </p>

        <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
          Workout Studio
        </h2>

        <p className="mt-3 text-sm leading-6 text-white/55">
          Perform your saved workout, track sets and rest between exercises.
        </p>
      </header>

      {loading ? (
        <LoadingState
          title="Loading workout plans"
          description="Fetching your saved workout plans..."
        />
      ) : error && !started && !finished ? (
        <ErrorState
          title="Unable to load workout plans"
          message={error}
          onRetry={loadPlans}
          retryLabel="Try again"
        />
      ) : finished ? (
        <section className="rounded-2xl border border-[#c5f66a]/20 bg-[#171a15] p-6">
          <CheckCircle2 size={34} className="text-[#c5f66a]" />

          <h3 className="mt-4 text-2xl font-bold">
            Workout saved!
          </h3>

          <p className="mt-2 text-sm text-white/55">
            {plan?.title} · {doneNames.length}/{exercises.length} exercises ·{' '}
            {clock(elapsed)}
          </p>

          {saved && (
            <p className="mt-3 text-sm text-[#c5f66a]">
              Session saved to workout history.
            </p>
          )}

          <Link
            to="/dashboard/workout-history"
            className="mt-5 inline-flex rounded-full bg-[#c5f66a] px-5 py-2.5 text-sm font-semibold text-[#10120f]"
          >
            View workout history
          </Link>
        </section>
      ) : !started ? (
        <section className="rounded-2xl border border-white/10 bg-[#171a15] p-5 sm:p-7">
          <h3 className="font-semibold">Choose a saved workout</h3>

          {!plans.length ? (
            <div className="mt-4">
              <EmptyState
                title="No saved workout plans"
                description="Generate or create a workout plan before starting your training session."
                actionLabel="Go to My Workouts"
                onAction={() => navigate('/dashboard/workouts')}
              />
            </div>
          ) : (
            <>
              <select
                value={planId}
                onChange={(event) => setPlanId(event.target.value)}
                className="mt-4 w-full rounded-xl border border-white/10 bg-[#10120f] px-3 py-3 text-sm text-white"
              >
                {plans.map((item) => (
                  <option key={item.id} value={item.id}>
                    Day {item.workout_day} — {item.title}
                  </option>
                ))}
              </select>

              <p className="mt-3 text-sm text-white/50">
                {plan?.focus} · {plan?.planned_exercises.length ?? 0} exercises
              </p>

              <button
                onClick={start}
                disabled={!plan?.planned_exercises.length}
                className="mt-5 rounded-full bg-[#c5f66a] px-6 py-3 text-sm font-semibold text-[#10120f] disabled:opacity-40"
              >
                <Play size={15} className="mr-2 inline" />
                Start workout
              </button>
            </>
          )}
        </section>
      ) : (
        <section className="space-y-5">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#171a15] p-5">
            <div>
              <p className="text-xs text-[#c5f66a]">{plan?.title}</p>
              <p className="mt-1 text-sm text-white/50">
                Exercise {index + 1} of {exercises.length}
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Clock3 size={16} className="text-[#c5f66a]" />
              {clock(elapsed)}
            </div>
          </div>

          {current && (
            <article className="rounded-2xl border border-[#c5f66a]/20 bg-[#171a15] p-5 sm:p-7">
              <p className="text-xs uppercase tracking-wider text-[#c5f66a]">
                Current exercise
              </p>

              <h3 className="mt-2 text-2xl font-bold">
                {current.exercise_name}
              </h3>

              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-xs text-white/45">Sets</p>
                  <p className="mt-1 font-bold">{current.sets}</p>
                </div>

                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-xs text-white/45">Reps</p>
                  <p className="mt-1 font-bold">{current.reps}</p>
                </div>

                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-xs text-white/45">Rest</p>
                  <p className="mt-1 font-bold">
                    {current.rest_seconds}s
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm text-white/60">
                Sets completed: {setsDone[current.id] ?? 0}/{current.sets}
              </p>

              {rest > 0 && (
                <p className="mt-3 text-3xl font-bold text-[#c5f66a]">
                  Rest: {clock(rest)}
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  onClick={completeSet}
                  disabled={
                    paused || (setsDone[current.id] ?? 0) >= current.sets
                  }
                  className="rounded-full bg-[#c5f66a] px-5 py-2.5 text-sm font-semibold text-[#10120f] disabled:opacity-40"
                >
                  Complete set
                </button>

                <button
                  onClick={() => setPaused((value) => !value)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm"
                >
                  {paused ? <Play size={15} /> : <Pause size={15} />}
                  {paused ? 'Resume' : 'Pause'}
                </button>

                <button
                  onClick={() => {
                    setIndex((value) =>
                      Math.min(value + 1, exercises.length - 1),
                    )
                    setRest(0)
                  }}
                  disabled={index >= exercises.length - 1}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm disabled:opacity-40"
                >
                  <SkipForward size={15} />
                  Skip
                </button>
              </div>
            </article>
          )}

          <div className="rounded-2xl border border-white/10 bg-[#171a15] p-5">
            <div className="flex justify-between">
              <h4 className="font-semibold">Session progress</h4>
              <span className="text-sm text-[#c5f66a]">
                {doneSets}/{totalSets} sets
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {exercises.map((exercise, exerciseIndex) => (
                <button
                  key={exercise.id}
                  onClick={() => {
                    setIndex(exerciseIndex)
                    setRest(0)
                  }}
                  className={`flex w-full justify-between rounded-xl border p-3 text-left text-sm ${
                    index === exerciseIndex
                      ? 'border-[#c5f66a]/40 bg-[#c5f66a]/5'
                      : 'border-white/5 bg-white/[0.02]'
                  }`}
                >
                  <span>
                    {(setsDone[exercise.id] ?? 0) >= exercise.sets
                      ? '✓ '
                      : ''}
                    {exercise.exercise_name}
                  </span>

                  <span className="text-xs text-white/45">
                    {setsDone[exercise.id] ?? 0}/{exercise.sets}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <ErrorState
              title="Could not save workout"
              message={error}
              onRetry={() => void finish()}
              retryLabel="Try saving again"
            />
          )}

          <button
            onClick={() => void finish()}
            disabled={saving}
            className="rounded-full bg-[#c5f66a] px-6 py-3 text-sm font-semibold text-[#10120f] disabled:opacity-50"
          >
            {saving ? (
              <span>Saving workout...</span>
            ) : (
              <>
                <CheckCircle2 size={15} className="mr-2 inline" />
                Finish & save session
              </>
            )}
          </button>
        </section>
      )}

      <p className="text-xs leading-5 text-white/40">
        The current workout history API stores completed exercise names and
        completion percentage. Individual set counts and session duration
        are shown during the session but are not persisted in history.
      </p>
    </div>
  )
}
