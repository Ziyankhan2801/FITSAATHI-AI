import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'
import EmptyState from '../../components/common/EmptyState'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Dumbbell,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
  Target,
  Trash2,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  addExerciseToPlan,
  createWorkoutPlan,
  createWorkoutSession,
  getExercises,
  getFitnessProfile,
  generatePersonalizedWorkout,
  getWorkoutPlans,
  getWorkoutSessions,
  removeExerciseFromPlan,
  updateWorkoutPlan,
  updateWorkoutSession,
  type Exercise as LibraryExercise,
  type FitnessProfile,
  type GeneratedWorkout,
  type GeneratedWorkoutDay,
  type WorkoutPlan,
  type WorkoutSession,
} from '../../services/api'

type Exercise = {
  id: string
  planExerciseId?: number
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

function buildWorkoutDays(
  plans: WorkoutPlan[],
  exercises: LibraryExercise[],
): WorkoutDay[] {
  return workoutDays.map((defaultDay) => {
    const dayNumber = Number(defaultDay.id.replace('day-', ''))
    const plan = plans.find((item) => item.workout_day === dayNumber)

    if (!plan) return defaultDay

    return {
      id: defaultDay.id,
      title: plan.title,
      focus: plan.focus || defaultDay.focus,
      exercises: plan.planned_exercises.map((item) => {
        const libraryExercise = exercises.find(
          (exercise) => exercise.id === item.exercise,
        )

        return {
          id: `custom-${item.id}`,
          planExerciseId: item.id,
          name: item.exercise_name,
          description: libraryExercise?.description ?? '',
          sets: item.sets,
          reps: item.reps,
          rest: item.rest_seconds,
        }
      }),
    }
  })
}

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

/**
 * Date creation stays outside the React component render.
 * The event handlers call this helper when the user changes workout progress.
 */
function getCurrentDate(): Date {
  return new Date()
}

function getLocalDate(now: Date): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function MyWorkouts() {
  const [profile, setProfile] = useState<FitnessProfile | null>(null)
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([])
  const [libraryExercises, setLibraryExercises] = useState<LibraryExercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [generatedWorkout, setGeneratedWorkout] = useState<GeneratedWorkout | null>(null)
  const [generatingWorkout, setGeneratingWorkout] = useState(false)
  const [generatorError, setGeneratorError] = useState('')
  const [savingGeneratedDay, setSavingGeneratedDay] = useState<number | null>(null)
  const [selectedDay, setSelectedDay] = useState('day-1')
  const [completedByDay, setCompletedByDay] = useState<Record<string, string[]>>({})
  const [sessionsByDay, setSessionsByDay] = useState<Record<number, WorkoutSession>>({})

  const [showEditor, setShowEditor] = useState(false)
  const [planBusy, setPlanBusy] = useState(false)
  const [planError, setPlanError] = useState('')
  const [planTitle, setPlanTitle] = useState('')
  const [planFocus, setPlanFocus] = useState('')
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [exerciseSets, setExerciseSets] = useState(2)
  const [exerciseReps, setExerciseReps] = useState('10 reps')
  const [exerciseRest, setExerciseRest] = useState(60)

  useEffect(() => {
    let active = true

    async function loadData() {
      try {
        const [profileData, sessions, plans, exercises] = await Promise.all([
          getFitnessProfile(),
          getWorkoutSessions(),
          getWorkoutPlans(),
          getExercises(),
        ])

        if (!active) return

        setProfile(profileData)
        setWorkoutPlans(plans)
        setLibraryExercises(exercises)

        const daysForSession = buildWorkoutDays(plans, exercises)
        const completed: Record<string, string[]> = {}
        const savedSessions: Record<number, WorkoutSession> = {}

        // Keep the latest saved session for each workout day.
        for (const session of sessions) {
          if (session.workout_day < 1 || session.workout_day > workoutDays.length) {
            continue
          }

          if (!savedSessions[session.workout_day]) {
            savedSessions[session.workout_day] = session
            const day = daysForSession[session.workout_day - 1]
            const validIds = new Set(day.exercises.map((exercise) => exercise.id))
            completed[day.id] = session.completed_exercises.filter((id) =>
              validIds.has(id),
            )
          }
        }

        setSessionsByDay(savedSessions)
        setCompletedByDay(completed)
      } catch (err: unknown) {
        if (active) {
          setError(
            err instanceof Error ? err.message : 'Could not load your workout data.',
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

  const workoutsWithCustomPlans = useMemo(
    () => buildWorkoutDays(workoutPlans, libraryExercises),
    [workoutPlans, libraryExercises],
  )

  const activeWorkout =
    workoutsWithCustomPlans.find((day) => day.id === selectedDay) ??
    workoutsWithCustomPlans[0]

  const dayNumber = Number(selectedDay.replace('day-', ''))
  const activePlan = workoutPlans.find((plan) => plan.workout_day === dayNumber)
  const completedExercises = completedByDay[selectedDay] ?? []
  const activeExerciseIds = activeWorkout.exercises.map((exercise) => exercise.id)
  const completedCount = activeExerciseIds.filter((id) =>
    completedExercises.includes(id),
  ).length
  const progress = activeWorkout.exercises.length
    ? Math.round((completedCount / activeWorkout.exercises.length) * 100)
    : 0

  const scheduledDays = Math.min(3, Math.max(1, profile?.workout_days_per_week ?? 3))
  const visibleWorkouts = useMemo(
    () => workoutsWithCustomPlans.slice(0, scheduledDays),
    [workoutsWithCustomPlans, scheduledDays],
  )

  const selectedLibraryExercise = libraryExercises.find(
    (exercise) => exercise.id === Number(selectedExerciseId),
  )

  async function refreshWorkoutPlans() {
    const plans = await getWorkoutPlans()
    setWorkoutPlans(plans)
  }

  function openPlanEditor() {
    setPlanTitle(activePlan?.title ?? activeWorkout.title)
    setPlanFocus(activePlan?.focus ?? activeWorkout.focus)
    setPlanError('')
    setShowEditor(true)
  }

  function closePlanEditor() {
    setShowEditor(false)
    setPlanError('')
  }

  async function saveCustomPlan() {
    if (!planTitle.trim()) {
      setPlanError('Please enter a workout plan title.')
      return
    }

    setPlanBusy(true)
    setPlanError('')

    try {
      if (activePlan) {
        await updateWorkoutPlan(activePlan.id, {
          title: planTitle.trim(),
          focus: planFocus.trim(),
        })
      } else {
        await createWorkoutPlan({
          workout_day: dayNumber,
          title: planTitle.trim(),
          focus: planFocus.trim(),
        })
      }

      await refreshWorkoutPlans()
      setShowEditor(false)
    } catch (err: unknown) {
      setPlanError(
        err instanceof Error ? err.message : 'Could not save workout plan.',
      )
    } finally {
      setPlanBusy(false)
    }
  }

  async function handleAddExercise() {
    if (!activePlan) {
      setPlanError('Create a custom workout plan before adding exercises.')
      return
    }

    if (!selectedExerciseId) {
      setPlanError('Select an exercise first.')
      return
    }

    if (!exerciseReps.trim()) {
      setPlanError('Enter the reps or duration for this exercise.')
      return
    }

    setPlanBusy(true)
    setPlanError('')

    try {
      await addExerciseToPlan(activePlan.id, {
        exercise: Number(selectedExerciseId),
        sets: exerciseSets,
        reps: exerciseReps.trim(),
        rest_seconds: exerciseRest,
        order: activePlan.planned_exercises.length,
      })
      await refreshWorkoutPlans()
      setSelectedExerciseId('')
      setExerciseSets(2)
      setExerciseReps('10 reps')
      setExerciseRest(60)
    } catch (err: unknown) {
      setPlanError(
        err instanceof Error ? err.message : 'Could not add exercise.',
      )
    } finally {
      setPlanBusy(false)
    }
  }

  async function handleRemoveExercise(planExerciseId: number) {
    setPlanBusy(true)
    setPlanError('')

    try {
      await removeExerciseFromPlan(planExerciseId)
      await refreshWorkoutPlans()
      setCompletedByDay((current) => ({
        ...current,
        [selectedDay]: (current[selectedDay] ?? []).filter(
          (id) => id !== `custom-${planExerciseId}`,
        ),
      }))
    } catch (err) {
      setPlanError(
        err instanceof Error ? err.message : 'Could not remove exercise.',
      )
    } finally {
      setPlanBusy(false)
    }
  }

  async function handleGenerateWorkout() {
    setGeneratingWorkout(true)
    setGeneratorError('')
    setGeneratedWorkout(null)

    try {
      const preview = await generatePersonalizedWorkout()
      setGeneratedWorkout(preview)
    } catch (err: unknown) {
      setGeneratorError(
        err instanceof Error ? err.message : 'Could not generate a personalized workout.',
      )
    } finally {
      setGeneratingWorkout(false)
    }
  }

  async function handleSaveGeneratedDay(day: GeneratedWorkoutDay) {
    const existingPlan = workoutPlans.find(
      (plan) => plan.workout_day === day.workout_day,
    )

    if (existingPlan) {
      setGeneratorError(
        `Day ${day.workout_day} already has a saved plan. It was not changed. Edit or remove that plan before saving this generated version.`,
      )
      return
    }

    setSavingGeneratedDay(day.workout_day)
    setGeneratorError('')

    try {
      const savedPlan = await createWorkoutPlan({
        workout_day: day.workout_day,
        title: day.title,
        focus: day.focus,
      })

      for (const exercise of day.planned_exercises) {
        await addExerciseToPlan(savedPlan.id, {
          exercise: exercise.exercise,
          sets: exercise.sets,
          reps: exercise.reps,
          rest_seconds: exercise.rest_seconds,
          order: exercise.order,
        })
      }

      await refreshWorkoutPlans()
    } catch (err: unknown) {
      await refreshWorkoutPlans()
      setGeneratorError(
        err instanceof Error
          ? `${err.message} The plan may have been partially saved; check your weekly plan before retrying.`
          : 'Could not save this generated day. Check your weekly plan before retrying.',
      )
    } finally {
      setSavingGeneratedDay(null)
    }
  }

  async function saveWorkoutProgress(
    day: WorkoutDay,
    completedIds: string[],
    now: Date,
  ) {
    const workoutDayNumber = Number(day.id.replace('day-', ''))
    const totalExercises = day.exercises.length
    const percentage = totalExercises
      ? Math.round((completedIds.length / totalExercises) * 100)
      : 0
    const completedToday = percentage === 100 && totalExercises > 0
    const existingSession = sessionsByDay[workoutDayNumber]
    const today = getLocalDate(now)
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
          : now.toISOString()
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
        err instanceof Error ? err.message : 'Could not save your workout progress.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function toggleExercise(id: string) {
    const currentIds = (completedByDay[selectedDay] ?? []).filter((item) =>
      activeExerciseIds.includes(item),
    )
    const nextIds = currentIds.includes(id)
      ? currentIds.filter((item) => item !== id)
      : [...currentIds, id]

    setCompletedByDay((current) => ({ ...current, [selectedDay]: nextIds }))
    await saveWorkoutProgress(activeWorkout, nextIds, getCurrentDate())
  }

  async function resetWorkout() {
    setCompletedByDay((current) => ({ ...current, [selectedDay]: [] }))
    await saveWorkoutProgress(activeWorkout, [], getCurrentDate())
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
          Follow your starter routine or build a custom plan using exercises from your library.
          Move at a comfortable pace and rest whenever you need to.
        </p>
      </header>

      {loading ? (
        <LoadingState
          title="Loading your workouts"
          description="Fetching your fitness profile and saved workout plans..."
        />
      ) : error ? (
        <ErrorState
          title="Unable to load your workouts"
          message={`${error} Check that you are logged in and the backend server is running.`}
          onRetry={() => window.location.reload()}
          retryLabel="Reload workouts"
        />
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
                  <p className="mt-1 font-semibold">{formatGoal(profile.fitness_goal)}</p>
                </div>
                <div>
                  <p className="text-sm text-white/45">Experience</p>
                  <p className="mt-1 font-semibold">{profile.experience_level || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-white/45">Preferred duration</p>
                  <p className="mt-1 font-semibold">{profile.workout_minutes ?? 30} minutes</p>
                </div>
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-[#c5f66a]/20 bg-[#171a15] p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#c5f66a]">
                  Personalized workout engine
                </p>
                <h3 className="mt-2 text-xl font-semibold">Generate your workout plan</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
                  Uses your saved fitness goal, experience, workout schedule, gym type,
                  training style and available equipment to create a reviewable plan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleGenerateWorkout()}
                disabled={generatingWorkout || savingGeneratedDay !== null}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#c5f66a] px-5 py-3 text-sm font-semibold text-[#10120f] transition hover:bg-[#d5ff83] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generatingWorkout ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Target size={16} />
                )}
                {generatingWorkout ? 'Generating...' : 'Generate workout'}
              </button>
            </div>

            {generatorError && (
              <p role="alert" className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
                {generatorError}
              </p>
            )}

            {generatedWorkout && (
              <div className="mt-6 space-y-4">
                <div className="rounded-xl bg-[#10120f] p-4">
                  <p className="text-sm font-medium text-[#c5f66a]">
                    {generatedWorkout.message}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-white/45">
                    {formatGoal(generatedWorkout.profile_summary.fitness_goal)} ·{' '}
                    {generatedWorkout.profile_summary.experience_level} ·{' '}
                    {generatedWorkout.profile_summary.workout_minutes} minutes ·{' '}
                    {generatedWorkout.profile_summary.gym_type ?? 'Gym type not set'} ·{' '}
                    {generatedWorkout.profile_summary.training_style ?? 'General training'}
                  </p>
                </div>

                {generatedWorkout.days.map((day) => {
                  const alreadySaved = workoutPlans.some(
                    (plan) => plan.workout_day === day.workout_day,
                  )

                  return (
                    <article key={day.workout_day} className="rounded-xl border border-white/10 bg-[#10120f]/70 p-4">
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                          <h4 className="font-semibold">{day.title}</h4>
                          <p className="mt-1 text-sm text-white/45">
                            {day.focus} · {day.planned_exercises.length} exercises
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleSaveGeneratedDay(day)}
                          disabled={alreadySaved || savingGeneratedDay !== null}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-[#c5f66a]/30 px-4 py-2 text-xs font-semibold text-[#c5f66a] transition hover:bg-[#c5f66a]/10 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {savingGeneratedDay === day.workout_day && (
                            <LoaderCircle size={14} className="animate-spin" />
                          )}
                          {alreadySaved ? 'Existing plan kept' : 'Save this day'}
                        </button>
                      </div>

                      <div className="mt-4 space-y-3">
                        {day.planned_exercises.map((exercise, index) => (
                          <div key={`${day.workout_day}-${exercise.exercise}`} className="rounded-lg bg-white/[0.03] p-3">
                            <p className="text-sm font-medium">
                              {index + 1}. {exercise.exercise_name}
                            </p>
                            {exercise.description && (
                              <p className="mt-1 text-xs leading-5 text-white/45">
                                {exercise.description}
                              </p>
                            )}
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/65">
                              <span className="rounded-md bg-white/5 px-2 py-1">{exercise.sets} sets</span>
                              <span className="rounded-md bg-white/5 px-2 py-1">{exercise.reps}</span>
                              <span className="rounded-md bg-white/5 px-2 py-1">{exercise.rest_seconds}s rest</span>
                              <span className="rounded-md bg-white/5 px-2 py-1">{exercise.muscle_group.replace('_', ' ')}</span>
                            </div>
                            {exercise.safety_tips && (
                              <p className="mt-2 text-xs text-amber-200/70">
                                Safety: {exercise.safety_tips}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </article>
                  )
                })}

                <p className="text-xs leading-5 text-white/40">
                  {generatedWorkout.safety_notice} This is a rule-based preview, not an AI medical assessment.
                </p>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold">Your weekly plan</h3>
              <p className="mt-1 text-sm text-white/45">Choose a workout day to see its exercises.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {visibleWorkouts.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  disabled={saving || planBusy}
                  onClick={() => {
                    setSelectedDay(day.id)
                    setShowEditor(false)
                    setPlanError('')
                  }}
                  className={`rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    selectedDay === day.id
                      ? 'border-[#c5f66a]/50 bg-[#c5f66a]/10'
                      : 'border-white/10 bg-[#171a15] hover:border-white/20'
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#c5f66a]">{day.title}</p>
                  <p className="mt-2 font-semibold">{day.focus}</p>
                  <p className="mt-2 text-xs text-white/45">{day.exercises.length} exercises</p>
                  <p className="mt-2 text-xs text-white/50">
                    {day.exercises.filter((exercise) => (completedByDay[day.id] ?? []).includes(exercise.id)).length}/
                    {day.exercises.length} completed
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#171a15] p-5 sm:p-7">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#c5f66a]">{activeWorkout.title}</p>
                <h3 className="mt-2 text-xl font-semibold">{activeWorkout.focus}</h3>
                <p className="mt-2 text-sm text-white/45">
                  {completedCount} of {activeWorkout.exercises.length} exercises completed
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={openPlanEditor}
                  disabled={planBusy}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#c5f66a]/30 px-4 py-2 text-sm text-[#c5f66a] transition hover:bg-[#c5f66a]/10 disabled:opacity-50"
                >
                  <Pencil size={15} />
                  {activePlan ? 'Edit plan' : 'Create custom plan'}
                </button>
                <button
                  type="button"
                  disabled={saving || completedCount === 0}
                  onClick={() => void resetWorkout()}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RotateCcw size={16} />
                  Reset day
                </button>
              </div>
            </div>

            {showEditor && (
              <div className="mt-6 rounded-2xl border border-[#c5f66a]/20 bg-[#10120f] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-semibold">{activePlan ? 'Edit workout plan' : 'Create custom workout plan'}</h4>
                    <p className="mt-1 text-xs text-white/45">{activeWorkout.title}</p>
                  </div>
                  <button type="button" onClick={closePlanEditor} aria-label="Close editor" className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white">
                    <X size={18} />
                  </button>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm text-white/65">
                    Plan title
                    <input
                      value={planTitle}
                      onChange={(event) => setPlanTitle(event.target.value)}
                      maxLength={150}
                      placeholder="e.g. Full body beginner"
                      className="mt-2 w-full rounded-xl border border-white/10 bg-[#171a15] px-3 py-2.5 text-sm text-white outline-none focus:border-[#c5f66a]/50"
                    />
                  </label>
                  <label className="text-sm text-white/65">
                    Workout focus
                    <input
                      value={planFocus}
                      onChange={(event) => setPlanFocus(event.target.value)}
                      maxLength={150}
                      placeholder="e.g. Strength and mobility"
                      className="mt-2 w-full rounded-xl border border-white/10 bg-[#171a15] px-3 py-2.5 text-sm text-white outline-none focus:border-[#c5f66a]/50"
                    />
                  </label>
                </div>
                {planError && <p role="alert" className="mt-3 text-sm text-red-300">{planError}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => void saveCustomPlan()} disabled={planBusy} className="inline-flex items-center gap-2 rounded-full bg-[#c5f66a] px-5 py-2.5 text-sm font-semibold text-[#10120f] transition hover:bg-[#d5ff83] disabled:opacity-50">
                    {planBusy && <LoaderCircle size={15} className="animate-spin" />}
                    Save plan
                  </button>
                  <button type="button" onClick={closePlanEditor} disabled={planBusy} className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-white/65 hover:bg-white/5 disabled:opacity-50">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {activePlan && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-[#10120f]/70 p-4 sm:p-5">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <h4 className="font-semibold">Add exercises</h4>
                    <p className="mt-1 text-xs text-white/45">Choose from your Exercise Library and customize the prescription.</p>
                  </div>
                  <Link to="/dashboard/exercise-library" className="text-xs font-medium text-[#c5f66a] hover:underline">Browse exercise library</Link>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm text-white/65 sm:col-span-2">
                    Exercise
                    <select
                      value={selectedExerciseId}
                      onChange={(event) => {
                        const value = event.target.value
                        setSelectedExerciseId(value)
                        const exercise = libraryExercises.find((item) => item.id === Number(value))
                        if (exercise) {
                          setExerciseSets(exercise.sets)
                          setExerciseReps(exercise.reps)
                          setExerciseRest(exercise.rest_seconds)
                        }
                      }}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-[#171a15] px-3 py-2.5 text-sm text-white outline-none focus:border-[#c5f66a]/50"
                    >
                      <option value="">Select an exercise</option>
                      {libraryExercises.map((exercise) => (
                        <option key={exercise.id} value={exercise.id}>{exercise.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm text-white/65">
                    Sets
                    <input type="number" min={1} max={20} value={exerciseSets} onChange={(event) => setExerciseSets(Math.min(20, Math.max(1, Number(event.target.value) || 1)))} className="mt-2 w-full rounded-xl border border-white/10 bg-[#171a15] px-3 py-2.5 text-sm text-white outline-none focus:border-[#c5f66a]/50" />
                  </label>
                  <label className="text-sm text-white/65">
                    Reps / duration
                    <input value={exerciseReps} onChange={(event) => setExerciseReps(event.target.value)} maxLength={50} placeholder="e.g. 10 reps or 30 seconds" className="mt-2 w-full rounded-xl border border-white/10 bg-[#171a15] px-3 py-2.5 text-sm text-white outline-none focus:border-[#c5f66a]/50" />
                  </label>
                  <label className="text-sm text-white/65">
                    Rest (seconds)
                    <input type="number" min={0} max={600} value={exerciseRest} onChange={(event) => setExerciseRest(Math.min(600, Math.max(0, Number(event.target.value) || 0)))} className="mt-2 w-full rounded-xl border border-white/10 bg-[#171a15] px-3 py-2.5 text-sm text-white outline-none focus:border-[#c5f66a]/50" />
                  </label>
                  <div className="flex items-end">
                    <button type="button" onClick={() => void handleAddExercise()} disabled={planBusy || !selectedExerciseId || !selectedLibraryExercise} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#c5f66a] px-4 py-2.5 text-sm font-semibold text-[#10120f] transition hover:bg-[#d5ff83] disabled:cursor-not-allowed disabled:opacity-50">
                      {planBusy ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />}
                      Add exercise
                    </button>
                  </div>
                </div>
                {planError && <p role="alert" className="mt-3 text-sm text-red-300">{planError}</p>}
                <p className="mt-3 text-xs text-white/40">{activePlan.planned_exercises.length} exercises currently in this custom plan.</p>
              </div>
            )}

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Workout completion">
              <div className="h-full rounded-full bg-[#c5f66a] transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-right text-xs text-white/45">{progress}% complete</p>

            {progress === 100 && activeWorkout.exercises.length > 0 && (
              <div role="status" className="mt-4 flex items-center gap-2 rounded-xl bg-[#c5f66a]/10 p-3 text-sm text-[#c5f66a]">
                <CheckCircle2 size={18} />
                Great work! You completed this day's exercise checklist.
              </div>
            )}

            {saving && (
              <p role="status" className="mt-4 flex items-center gap-2 text-xs text-white/50">
                <LoaderCircle size={14} className="animate-spin" />
                Saving your progress...
              </p>
            )}
            {saveError && (
              <div role="alert" className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
                Progress could not be saved: {saveError}
                <p className="mt-1 text-xs text-red-200/80">The visible checkbox state may not match the database. Retry after checking your connection.</p>
              </div>
            )}

            <div className="mt-6 space-y-4">
              {activeWorkout.exercises.length === 0 ? (
                <EmptyState
                  title="No exercises in this workout"
                  description="Choose exercises from your Exercise Library above to build this day."
                  actionLabel={activePlan ? undefined : 'Create custom plan'}
                  onAction={activePlan ? undefined : openPlanEditor}
                />
              ) : (
                activeWorkout.exercises.map((exercise, index) => {
                  const done = completedExercises.includes(exercise.id)
                  return (
                    <article key={exercise.id} className={`rounded-xl border p-4 transition ${done ? 'border-[#c5f66a]/30 bg-[#c5f66a]/5' : 'border-white/10 bg-[#10120f]/60'}`}>
                      <div className="flex items-start gap-3">
                        <input type="checkbox" checked={done} disabled={saving || planBusy} onChange={() => void toggleExercise(exercise.id)} aria-label={`Mark ${exercise.name} complete`} className="mt-1 h-5 w-5 shrink-0 accent-[#c5f66a] disabled:cursor-not-allowed" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className={`font-semibold ${done ? 'text-[#c5f66a]' : 'text-white'}`}>{index + 1}. {exercise.name}</h4>
                            {done && <span className="text-xs text-[#c5f66a]">Completed</span>}
                          </div>
                          {exercise.description && <p className="mt-2 text-sm leading-5 text-white/50">{exercise.description}</p>}
                          <div className="mt-4 flex flex-wrap gap-3 text-xs">
                            <span className="rounded-lg bg-white/5 px-3 py-2 text-white/70">{exercise.sets} sets</span>
                            <span className="rounded-lg bg-white/5 px-3 py-2 text-white/70">{exercise.reps}</span>
                            <span className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-3 py-2 text-white/70"><Clock3 size={13} />{exercise.rest}s rest</span>
                          </div>
                        </div>
                        {exercise.planExerciseId && (
                          <button type="button" disabled={planBusy} onClick={() => void handleRemoveExercise(exercise.planExerciseId!)} aria-label={`Remove ${exercise.name}`} title="Remove exercise" className="rounded-lg p-2 text-white/35 transition hover:bg-red-400/10 hover:text-red-300 disabled:opacity-40">
                            {planBusy ? <LoaderCircle size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        )}
                      </div>
                    </article>
                  )
                })
              )}
            </div>
          </section>

          <p className="text-xs leading-5 text-white/40">
            Starter routine only, not a medical assessment. Skip any movement that causes pain or discomfort. Stop if you feel dizzy or unusually breathless. Workout progress is saved to your account when the API confirms the save.
          </p>
        </>
      )}
    </div>
  )
}