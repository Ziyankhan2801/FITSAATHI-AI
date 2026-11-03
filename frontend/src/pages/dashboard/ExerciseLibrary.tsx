
import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Filter,
  LoaderCircle,
  PlayCircle,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  getExercises,
  getExercise,
  type Exercise,
  type ExerciseCategory,
  type ExerciseDifficulty,
  type ExerciseEquipment,
  type ExerciseFilters,
  type ExerciseMuscleGroup,
} from '../../services/api'

const categories: { label: string; value: ExerciseCategory | '' }[] = [
  { label: 'All categories', value: '' },
  { label: 'Strength', value: 'strength' },
  { label: 'Cardio', value: 'cardio' },
  { label: 'Flexibility', value: 'flexibility' },
  { label: 'Mobility', value: 'mobility' },
  { label: 'Balance', value: 'balance' },
]

const muscleGroups: { label: string; value: ExerciseMuscleGroup | '' }[] = [
  { label: 'All muscle groups', value: '' },
  { label: 'Chest', value: 'chest' },
  { label: 'Back', value: 'back' },
  { label: 'Shoulders', value: 'shoulders' },
  { label: 'Arms', value: 'arms' },
  { label: 'Core', value: 'core' },
  { label: 'Legs', value: 'legs' },
  { label: 'Full body', value: 'full_body' },
]

const difficulties: { label: string; value: ExerciseDifficulty | '' }[] = [
  { label: 'All levels', value: '' },
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
]

const equipmentOptions: { label: string; value: ExerciseEquipment | '' }[] = [
  { label: 'All equipment', value: '' },
  { label: 'No equipment', value: 'none' },
  { label: 'Dumbbell', value: 'dumbbell' },
  { label: 'Resistance band', value: 'resistance_band' },
  { label: 'Chair', value: 'chair' },
  { label: 'Exercise mat', value: 'mat' },
  { label: 'Other', value: 'other' },
]

function formatLabel(value: string): string {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getDifficultyStyle(difficulty: ExerciseDifficulty): string {
  if (difficulty === 'beginner') {
    return 'border-[#c5f66a]/20 bg-[#c5f66a]/10 text-[#c5f66a]'
  }

  if (difficulty === 'intermediate') {
    return 'border-amber-400/20 bg-amber-400/10 text-amber-300'
  }

  return 'border-red-400/20 bg-red-400/10 text-red-300'
}

function ExerciseCard({
  exercise,
  onSelect,
}: {
  exercise: Exercise
  onSelect: (id: number) => void
}) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-[#171a15] transition hover:-translate-y-1 hover:border-[#c5f66a]/30">
      <div className="relative flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br from-[#c5f66a]/10 via-[#20251b] to-[#10120f]">
        {exercise.image_url ? (
          <img
            src={exercise.image_url}
            alt={exercise.name}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#c5f66a]/20 bg-[#c5f66a]/10 text-[#c5f66a]">
            <Dumbbell size={30} />
          </div>
        )}

        <span className="absolute left-3 top-3 rounded-full border border-white/10 bg-[#10120f]/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/75">
          {formatLabel(exercise.category)}
        </span>

        <span className={`absolute bottom-3 right-3 rounded-full border px-3 py-1 text-[10px] font-semibold ${getDifficultyStyle(exercise.difficulty)}`}>
          {formatLabel(exercise.difficulty)}
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-white transition group-hover:text-[#c5f66a]">
              {exercise.name}
            </h3>
            <p className="mt-1 text-xs text-white/40">
              {formatLabel(exercise.muscle_group)}
            </p>
          </div>

          <Activity size={18} className="shrink-0 text-[#c5f66a]" />
        </div>

        <p className="mt-4 min-h-10 text-sm leading-5 text-white/50">
          {exercise.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-lg bg-white/5 px-3 py-2 text-xs text-white/65">
            {exercise.sets} sets
          </span>

          <span className="rounded-lg bg-white/5 px-3 py-2 text-xs text-white/65">
            {exercise.reps}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
          <span className="inline-flex items-center gap-1.5 text-xs text-white/40">
            <Clock3 size={13} />
            {exercise.rest_seconds}s rest
          </span>

          <button
            type="button"
            onClick={() => onSelect(exercise.id)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#c5f66a] transition hover:text-white"
          >
            View details
            <ArrowUpRight size={15} />
          </button>
        </div>
      </div>
    </article>
  )
}

function ExerciseDetailModal({
  exercise,
  onClose,
}: {
  exercise: Exercise
  onClose: () => void
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercise-detail-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#171a15] shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#171a15]/95 p-5 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#c5f66a]">
            Exercise details
          </p>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close exercise details"
            className="rounded-full border border-white/10 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 sm:p-7">
          {exercise.image_url && (
            <img
              src={exercise.image_url}
              alt={exercise.name}
              className="mb-5 max-h-64 w-full rounded-2xl bg-black/20 object-contain"
            />
          )}

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-[#c5f66a]/10 px-3 py-1 text-xs text-[#c5f66a]">
              {formatLabel(exercise.category)}
            </span>
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/60">
              {formatLabel(exercise.muscle_group)}
            </span>
            <span className={`rounded-full border px-3 py-1 text-xs ${getDifficultyStyle(exercise.difficulty)}`}>
              {formatLabel(exercise.difficulty)}
            </span>
          </div>

          <h2
            id="exercise-detail-title"
            className="mt-4 text-2xl font-bold sm:text-3xl"
          >
            {exercise.name}
          </h2>

          <p className="mt-3 text-sm leading-6 text-white/55">
            {exercise.description}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Sets', value: String(exercise.sets) },
              { label: 'Reps / Duration', value: exercise.reps },
              { label: 'Rest', value: `${exercise.rest_seconds}s` },
              { label: 'Equipment', value: formatLabel(exercise.equipment) },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/10 bg-[#10120f] p-3"
              >
                <p className="text-[10px] uppercase tracking-wider text-white/40">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-7">
            <h3 className="flex items-center gap-2 font-semibold">
              <CheckCircle2 size={18} className="text-[#c5f66a]" />
              How to perform
            </h3>

            {exercise.instructions.length > 0 ? (
              <ol className="mt-4 space-y-3">
                {exercise.instructions.map((instruction, index) => (
                  <li key={`${index}-${instruction}`} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#c5f66a]/10 text-xs font-bold text-[#c5f66a]">
                      {index + 1}
                    </span>
                    <p className="pt-1 text-sm leading-6 text-white/65">
                      {instruction}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm text-white/45">
                Instructions are not available yet.
              </p>
            )}
          </div>

          {exercise.safety_tips && (
            <div className="mt-7 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-300">
                <ShieldCheck size={17} />
                Safety tips
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/60">
                {exercise.safety_tips}
              </p>
            </div>
          )}

          {exercise.video_url && (
            <a
              href={exercise.video_url}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#c5f66a] px-5 py-3 text-sm font-semibold text-[#10120f] transition hover:bg-white"
            >
              <PlayCircle size={17} />
              Watch demonstration
            </a>
          )}
        </div>
      </section>
    </div>
  )
}

export default function ExerciseLibrary() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ExerciseCategory | ''>('')
  const [muscleGroup, setMuscleGroup] = useState<ExerciseMuscleGroup | ''>('')
  const [difficulty, setDifficulty] = useState<ExerciseDifficulty | ''>('')
  const [equipment, setEquipment] = useState<ExerciseEquipment | ''>('')
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const filters = useMemo<ExerciseFilters>(
    () => ({
      search,
      category,
      muscle_group: muscleGroup,
      difficulty,
      equipment,
    }),
    [search, category, muscleGroup, difficulty, equipment],
  )

  useEffect(() => {
    let active = true

    async function loadExercises() {
      setLoading(true)
      setError('')

      try {
        const data = await getExercises(filters)
        if (active) setExercises(data)
      } catch (err: unknown) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load exercises.',
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    const timeout = window.setTimeout(() => {
      void loadExercises()
    }, 250)

    return () => {
      active = false
      window.clearTimeout(timeout)
    }
  }, [filters])

  async function openExercise(id: number) {
    setDetailLoading(true)
    setDetailError('')
    setSelectedExercise(null)

    try {
      const exercise = await getExercise(id)
      setSelectedExercise(exercise)
    } catch (err: unknown) {
      setDetailError(
        err instanceof Error
          ? err.message
          : 'Could not load exercise details.',
      )
    } finally {
      setDetailLoading(false)
    }
  }

  const activeFilterCount = [
    category,
    muscleGroup,
    difficulty,
    equipment,
  ].filter(Boolean).length

  function clearFilters() {
    setSearch('')
    setCategory('')
    setMuscleGroup('')
    setDifficulty('')
    setEquipment('')
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7">
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

        <p className="mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#c5f66a]">
          <Sparkles size={14} />
          Explore and learn
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Exercise library
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
          Discover exercises for your fitness journey. Learn the correct
          movements, explore muscle groups and find activities that match
          your equipment and experience.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-[#171a15] p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search exercises..."
              aria-label="Search exercises"
              className="w-full rounded-xl border border-white/10 bg-[#10120f] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#c5f66a]/50"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            aria-expanded={showFilters}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-white/75 transition hover:border-[#c5f66a]/40 hover:text-[#c5f66a]"
          >
            <SlidersHorizontal size={17} />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c5f66a] px-1 text-[10px] font-bold text-[#10120f]">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mt-5 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: 'Category',
                value: category,
                options: categories,
                onChange: setCategory,
              },
              {
                label: 'Muscle group',
                value: muscleGroup,
                options: muscleGroups,
                onChange: setMuscleGroup,
              },
              {
                label: 'Difficulty',
                value: difficulty,
                options: difficulties,
                onChange: setDifficulty,
              },
              {
                label: 'Equipment',
                value: equipment,
                options: equipmentOptions,
                onChange: setEquipment,
              },
            ].map((filter) => (
              <label key={filter.label} className="space-y-2">
                <span className="text-xs font-semibold text-white/55">
                  {filter.label}
                </span>
                <select
                  value={filter.value}
                  onChange={(event) =>
                    filter.onChange(event.target.value as never)
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#10120f] px-3 py-3 text-sm text-white outline-none focus:border-[#c5f66a]/50"
                >
                  {filter.options.map((option) => (
                    <option
                      key={option.value || 'all'}
                      value={option.value}
                      className="bg-[#171a15]"
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}

            <div className="flex items-end sm:col-span-2 lg:col-span-4">
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-2 text-xs font-semibold text-white/45 transition hover:text-[#c5f66a]"
              >
                <RotateCcwIcon />
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Explore exercises</h2>
          <p className="mt-1 text-xs text-white/40">
            {loading
              ? 'Finding exercises...'
              : `${exercises.length} exercises found`}
          </p>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#171a15] px-3 py-2 text-xs text-white/55">
          <Filter size={14} className="text-[#c5f66a]" />
          Beginner-friendly options available
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#171a15] p-12 text-sm text-white/55">
          <LoaderCircle size={20} className="animate-spin text-[#c5f66a]" />
          Loading exercise library...
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-sm text-red-300"
        >
          <p className="font-semibold">Could not load exercises</p>
          <p className="mt-2">{error}</p>
          <button
            type="button"
            onClick={() => setSearch((value) => `${value}`)}
            className="mt-4 rounded-full border border-red-300/20 px-4 py-2 text-xs font-semibold hover:bg-red-400/10"
          >
            Retry by refreshing the page
          </button>
        </div>
      ) : exercises.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#171a15] p-12 text-center">
          <Search size={30} className="mx-auto text-white/30" />
          <h3 className="mt-4 font-semibold">No exercises found</h3>
          <p className="mt-2 text-sm text-white/45">
            Try another search term or clear your filters.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-5 rounded-full bg-[#c5f66a] px-5 py-2.5 text-sm font-semibold text-[#10120f] transition hover:bg-white"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onSelect={openExercise}
            />
          ))}
        </div>
      )}

      {detailLoading && (
        <div
          role="status"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#171a15] px-6 py-5 text-sm text-white/70">
            <LoaderCircle size={20} className="animate-spin text-[#c5f66a]" />
            Loading exercise details...
          </div>
        </div>
      )}

      {detailError && (
        <div
          role="alert"
          className="fixed bottom-5 right-5 z-[60] max-w-sm rounded-xl border border-red-400/20 bg-[#171a15] p-4 text-sm text-red-300 shadow-xl"
        >
          <div className="flex items-start justify-between gap-4">
            {detailError}
            <button
              type="button"
              onClick={() => setDetailError('')}
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
        />
      )}

      <p className="text-xs leading-5 text-white/35">
        Exercise descriptions are educational guidance, not a medical
        assessment. Choose movements suited to your abilities, use stable
        equipment and stop if you experience pain, dizziness or unusual
        breathlessness.
      </p>
    </div>
  )
}

function RotateCcwIcon() {
  return <ArrowLeft size={14} />
}
