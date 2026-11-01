
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Dumbbell,
  LoaderCircle,
  RotateCcw,
  Target,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  createWorkoutSession,
  getFitnessProfile,
  getWorkoutSessions,
  updateWorkoutSession,
  type FitnessProfile,
  type WorkoutSession,
} from '../../services/api'

type Exercise = {
  id: string
  name: string
  description: string
  sets: number
  reps: string
  rest: number
}

type WorkoutDay = {
  id: string
  title: string
  focus: string
  exercises: Exercise[]
}

const workoutDays: WorkoutDay[] = [
  {
    id: 'day-1',
    title: 'Day 1',
    focus: 'Full-body basics',
    exercises: [
      {
        id: 'march',
        name: 'March in place',
        description: 'March gently, keeping your movements controlled.',
        sets: 2,
        reps: '45 seconds',
        rest: 30,
      },
      {
        id: 'chair-squat',
        name: 'Chair sit-to-stand',
        description: 'Use a stable chair and stand up slowly, then sit with control.',
        sets: 2,
        reps: '8 reps',
        rest: 60,
      },
      {
        id: 'wall-pushup',
        name: 'Wall push-ups',
        description: 'Keep your body straight and move toward the wall comfortably.',
        sets: 2,
        reps: '8 reps',
        rest: 60,
      },
      {
        id: 'calf-raise',
        name: 'Supported calf raises',
        description: 'Hold a stable support and rise gently onto your toes.',
        sets: 2,
        reps: '10 reps',
        rest: 45,
      },
    ],
  },
  {
    id: 'day-2',
    title: 'Day 2',
    focus: 'Low-impact movement',
    exercises: [
      {
        id: 'step-touch',
        name: 'Side steps',
        description: 'Step side to side at a comfortable pace.',
        sets: 2,
        reps: '45 seconds',
        rest: 30,
      },
      {
        id: 'standing-knee',
        name: 'Standing knee raises',
        description: 'Raise one knee at a time without rushing.',
        sets: 2,
        reps: '8 each side',
        rest: 45,
      },
      {
        id: 'wall-pushup-2',
        name: 'Wall push-ups',
        description: 'Use a comfortable range of motion.',
        sets: 2,
        reps: '8 reps',
        rest: 60,
      },
      {
        id: 'gentle-mobility',
        name: 'Gentle shoulder rolls',
        description: 'Make slow, comfortable circles with your shoulders.',
        sets: 2,
        reps: '10 reps',
        rest: 30,
      },
    ],
  },
  {
    id: 'day-3',
    title: 'Day 3',
    focus: 'Strength and control',
    exercises: [
      {
        id: 'march-3',
        name: 'March in place',
        description: 'Start gently to warm up your body.',
        sets: 2,
        reps: '45 seconds',
        rest: 30,
      },
      {
        id: 'chair-squat-3',
        name: 'Chair sit-to-stand',
        description: 'Use a stable chair and only a comfortable range of motion.',
        sets: 2,
        reps: '8 reps',
        rest: 60,
      },
      {
        id: 'wall-pushup-3',
        name: 'Wall push-ups',
        description: 'Keep your movements slow and controlled.',
        sets: 2,
        reps: '8 reps',
        rest: 60,
      },
      {
        id: 'calf-raise-3',
        name: 'Supported calf raises',
        description: 'Use a stable support for balance.',
        sets: 2,
        reps: '10 reps',
        rest: 45,
      },
    ],
  },
]

function formatGoal(goal: string): string {
  const labels: Record<string, string> = {
    weight_loss: 'Weight loss',
    muscle_gain: 'Muscle gain',
    general_fitness: 'General fitness',
    stamina: 'Improve stamina',
    flexibility: 'Flexibility',
  }

  return labels[goal] ?? 'General fitness'
}

function getLocalDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export default function MyWorkouts() {
  const [profile, setProfile] = useState<FitnessProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedDay, setSelectedDay] = useState('day-1')

  const [completedByDay, setCompletedByDay] = useState<
    Record<string, string[]>
  >({})

  const [sessionsByDay, setSessionsByDay] = useState<
    Record<number, WorkoutSession>
  >({})

  useEffect(() => {
    let active = true

    async function loadData() {
      try {
        const [profileData, sessions] = await Promise.all([
          getFitnessProfile(),
          getWorkoutSessions(),
        ])

        if (!active) return

        setProfile(profileData)

        const completed: Record<string, string[]> = {}
        const savedSessions: Record<number, WorkoutSession> = {}

        // Keep the latest saved session for each workout day.
        for (const session of sessions) {
          if (
            session.workout_day < 1 ||
            session.workout_day > workoutDays.length
          ) {
            continue
          }

          if (!savedSessions[session.workout_day]) {
            savedSessions[session.workout_day] = session

            const day = workoutDays[session.workout_day - 1]
            const validExerciseIds = new Set(
              day.exercises.map((exercise) => exercise.id),
            )

            completed[day.id] = session.completed_exercises.filter(
              (id) => validExerciseIds.has(id),
            )
          }
        }

        setSessionsByDay(savedSessions)
        setCompletedByDay(completed)
      } catch (err: unknown) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load your workout data.',
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadData()

    return () => {
      active = false
    }
  }, [])

  const activeWorkout = workoutDays.find((day) => day.id === selectedDay)!

  const completedExercises = completedByDay[selectedDay] ?? []

  const activeExerciseIds = activeWorkout.exercises.map(
    (exercise) => exercise.id,
  )

  const completedCount = activeExerciseIds.filter((id) =>
    completedExercises.includes(id),
  ).length

  const progress = Math.round(
    (completedCount / activeWorkout.exercises.length) * 100,
  )

  const scheduledDays = Math.min(
    3,
    Math.max(1, profile?.workout_days_per_week ?? 3),
  )

  const visibleWorkouts = useMemo(
    () => workoutDays.slice(0, scheduledDays),
    [scheduledDays],
  )

  
  async function saveWorkoutProgress(
    day: WorkoutDay,
    completedIds: string[],
  ) {
    const workoutDayNumber = Number(day.id.replace('day-', ''))
    const totalExercises = day.exercises.length
    const percentage = totalExercises
      ? Math.round((completedIds.length / totalExercises) * 100)
      : 0

    const completedToday = percentage === 100
    const existingSession = sessionsByDay[workoutDayNumber]
    const today = getLocalDate()

    // Preserve the original timestamp when this session is already
    // completed for today. Otherwise, set a new timestamp on completion.
    const isAlreadyCompletedToday =
      existingSession?.completion_percentage === 100 &&
      existingSession.workout_date === today

    const data = {
      workout_day: workoutDayNumber,
      workout_title: day.focus,
      completed_exercises: completedIds,
      total_exercises: totalExercises,
      completion_percentage: percentage,
      completed_at: completedToday
        ? isAlreadyCompletedToday
          ? existingSession.completed_at
          : new Date().toISOString()
        : null,
      workout_date: completedToday
        ? isAlreadyCompletedToday
          ? existingSession.workout_date
          : today
        : null,
    }

    setSaving(true)
    setSaveError('')

    try {
      const savedSession = existingSession
        ? await updateWorkoutSession(existingSession.id, data)
        : await createWorkoutSession(data)

      setSessionsByDay((current) => ({
        ...current,
        [workoutDayNumber]: savedSession,
      }))
    } catch (err: unknown) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'Could not save your workout progress.',
      )
    } finally {
      setSaving(false)
    }
  }


  async function toggleExercise(id: string) {
    const currentIds = completedByDay[selectedDay] ?? []

    const nextIds = currentIds.includes(id)
      ? currentIds.filter((item) => item !== id)
      : [...currentIds, id]

    setCompletedByDay((current) => ({
      ...current,
      [selectedDay]: nextIds,
    }))

    await saveWorkoutProgress(activeWorkout, nextIds)
  }

  async function resetWorkout() {
    setCompletedByDay((current) => ({
      ...current,
      [selectedDay]: [],
    }))

    await saveWorkoutProgress(activeWorkout, [])
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
          <Dumbbell size={24} />
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#c5f66a]">
          Your training space
        </p>

        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          My workouts
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
          A simple, equipment-free starter routine. Move at a comfortable pace
          and rest whenever you need to.
        </p>
      </header>

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#171a15] p-6 text-sm text-white/60">
          <LoaderCircle size={20} className="animate-spin" />
          Loading your fitness profile and saved workouts...
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300"
        >
          {error}
          <p className="mt-2 text-xs text-red-200/80">
            Check that you are logged in and the backend server is running.
            Refresh the page after resolving the issue.
          </p>
        </div>
      ) : (
        <>
          {profile && (
            <section className="rounded-2xl border border-white/10 bg-[#171a15] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <Target size={20} className="text-[#c5f66a]" />
                <h3 className="font-semibold">Your plan overview</h3>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-white/45">Goal</p>
                  <p className="mt-1 font-semibold">
                    {formatGoal(profile.fitness_goal)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-white/45">Experience</p>
                  <p className="mt-1 font-semibold">
                    {profile.experience_level || 'Not set'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-white/45">Preferred duration</p>
                  <p className="mt-1 font-semibold">
                    {profile.workout_minutes ?? 30} minutes
                  </p>
                </div>
              </div>
            </section>
          )}

          <section className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold">Your weekly plan</h3>
              <p className="mt-1 text-sm text-white/45">
                Choose a workout day to see its exercises.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {visibleWorkouts.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  disabled={saving}
                  onClick={() => setSelectedDay(day.id)}
                  className={`rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    selectedDay === day.id
                      ? 'border-[#c5f66a]/50 bg-[#c5f66a]/10'
                      : 'border-white/10 bg-[#171a15] hover:border-white/20'
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#c5f66a]">
                    {day.title}
                  </p>

                  <p className="mt-2 font-semibold">{day.focus}</p>

                  <p className="mt-2 text-xs text-white/45">
                    {day.exercises.length} exercises
                  </p>

                  <p className="mt-2 text-xs text-white/50">
                    {(completedByDay[day.id] ?? []).length}/
                    {day.exercises.length} completed
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#171a15] p-5 sm:p-7">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#c5f66a]">
                  {activeWorkout.title}
                </p>

                <h3 className="mt-2 text-xl font-semibold">
                  {activeWorkout.focus}
                </h3>

                <p className="mt-2 text-sm text-white/45">
                  {completedCount} of {activeWorkout.exercises.length} exercises
                  completed
                </p>
              </div>

              <button
                type="button"
                disabled={saving || completedCount === 0}
                onClick={() => void resetWorkout()}
                className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RotateCcw size={16} />
                Reset day
              </button>
            </div>

            <div
              className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Workout completion"
            >
              <div
                className="h-full rounded-full bg-[#c5f66a] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="mt-2 text-right text-xs text-white/45">
              {progress}% complete
            </p>

            {progress === 100 && (
              <div
                role="status"
                className="mt-4 flex items-center gap-2 rounded-xl bg-[#c5f66a]/10 p-3 text-sm text-[#c5f66a]"
              >
                <CheckCircle2 size={18} />
                Great work! You completed this day's exercise checklist.
              </div>
            )}

            {saving && (
              <p
                role="status"
                className="mt-4 flex items-center gap-2 text-xs text-white/50"
              >
                <LoaderCircle size={14} className="animate-spin" />
                Saving your progress...
              </p>
            )}

            {saveError && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300"
              >
                Progress could not be saved: {saveError}
                <p className="mt-1 text-xs text-red-200/80">
                  The visible checkbox state may not match the database.
                  Retry after checking your connection.
                </p>
              </div>
            )}

            <div className="mt-6 space-y-4">
              {activeWorkout.exercises.map((exercise, index) => {
                const done = completedExercises.includes(exercise.id)

                return (
                  <article
                    key={exercise.id}
                    className={`rounded-xl border p-4 transition ${
                      done
                        ? 'border-[#c5f66a]/30 bg-[#c5f66a]/5'
                        : 'border-white/10 bg-[#10120f]/60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={done}
                        disabled={saving}
                        onChange={() => void toggleExercise(exercise.id)}
                        aria-label={`Mark ${exercise.name} complete`}
                        className="mt-1 h-5 w-5 shrink-0 accent-[#c5f66a] disabled:cursor-not-allowed"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4
                            className={`font-semibold ${
                              done ? 'text-[#c5f66a]' : 'text-white'
                            }`}
                          >
                            {index + 1}. {exercise.name}
                          </h4>

                          {done && (
                            <span className="text-xs text-[#c5f66a]">
                              Completed
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-sm leading-5 text-white/50">
                          {exercise.description}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-3 text-xs">
                          <span className="rounded-lg bg-white/5 px-3 py-2 text-white/70">
                            {exercise.sets} sets
                          </span>

                          <span className="rounded-lg bg-white/5 px-3 py-2 text-white/70">
                            {exercise.reps}
                          </span>

                          <span className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-3 py-2 text-white/70">
                            <Clock3 size={13} />
                            {exercise.rest}s rest
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>

          <p className="text-xs leading-5 text-white/40">
            Starter routine only, not a medical assessment. Since your health
            limitations have not been confirmed, skip any movement that causes
            pain or discomfort. Stop if you feel dizzy or unusually breathless.
            Workout progress is saved to your account when the API confirms
            the save.
          </p>
        </>
      )}
    </div>
  )
}
