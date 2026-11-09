
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeft, CheckCircle2, LoaderCircle, Save, Target } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getFitnessProfile, updateFitnessProfile } from '../../services/api'

type FitnessForm = {
  date_of_birth: string
  height_cm: string
  weight_kg: string
  fitness_goal: string
  experience_level: string
  workout_days_per_week: string
  workout_minutes: string
  equipment_level: string
  dietary_preference: string
  sleep_hours: string
  has_health_limitation: string
  safety_notes: string
}

const initialForm: FitnessForm = {
  date_of_birth: '',
  height_cm: '',
  weight_kg: '',
  fitness_goal: '',
  experience_level: '',
  workout_days_per_week: '',
  workout_minutes: '',
  equipment_level: '',
  dietary_preference: '',
  sleep_hours: '',
  has_health_limitation: '',
  safety_notes: '',
}

const inputClass =
  'mt-2 w-full rounded-xl border border-white/10 bg-[#10120f] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#c5f66a]/60'

const labelClass = 'text-sm font-medium text-white/80'

// Format a date using local calendar values, without UTC conversion.
function getLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className={labelClass}>
      {label}
      {children}
    </label>
  )
}

export default function FitnessAssessment() {
  const [form, setForm] = useState<FitnessForm>(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [workoutWeekdays, setWorkoutWeekdays] = useState<number[]>([])

  // Use the browser's local date for the maximum DOB.
  const [maxBirthDate] = useState(() => getLocalDateString(new Date()))

  useEffect(() => {
    let active = true

    getFitnessProfile()
      .then((profile) => {
        if (!active) return

        setWorkoutWeekdays(profile.workout_weekdays ?? [])

        const validGoals = [
          'weight_loss',
          'muscle_gain',
          'general_fitness',
          'stamina',
          'flexibility',
        ]

        const validExperience = ['beginner', 'intermediate', 'advanced']
        const validEquipment = ['none', 'basic', 'home_gym']

        const validDiet = [
          'vegetarian',
          'vegan',
          'eggetarian',
          'non_vegetarian',
          'no_preference',
        ]

        setForm({
          date_of_birth: profile.date_of_birth ?? '',
          height_cm: profile.height_cm?.toString() ?? '',
          weight_kg: profile.weight_kg?.toString() ?? '',

          fitness_goal: validGoals.includes(profile.fitness_goal)
            ? profile.fitness_goal
            : '',

          experience_level: validExperience.includes(profile.experience_level)
            ? profile.experience_level
            : '',

          workout_days_per_week:
            profile.workout_days_per_week?.toString() ?? '',

          workout_minutes: profile.workout_minutes?.toString() ?? '',

          equipment_level: validEquipment.includes(profile.equipment_level)
            ? profile.equipment_level
            : '',

          dietary_preference: validDiet.includes(profile.dietary_preference)
            ? profile.dietary_preference
            : '',

          sleep_hours: profile.sleep_hours?.toString() ?? '',

          has_health_limitation:
            profile.has_health_limitation === null
              ? ''
              : profile.has_health_limitation
                ? 'yes'
                : 'no',

          safety_notes: profile.safety_notes ?? '',
        })
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load your fitness profile.',
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  function updateField<K extends keyof FitnessForm>(
    field: K,
    value: FitnessForm[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
    setError('')
    setSuccess('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const height = form.height_cm.trim()
      ? Number(form.height_cm)
      : null

    const weight = form.weight_kg.trim()
      ? Number(form.weight_kg)
      : null

    const days = form.workout_days_per_week.trim()
      ? Number(form.workout_days_per_week)
      : null

    const minutes = form.workout_minutes.trim()
      ? Number(form.workout_minutes)
      : null

    const sleep = form.sleep_hours.trim()
      ? Number(form.sleep_hours)
      : null

    // Height validation
    if (
      height !== null &&
      (!Number.isFinite(height) || height < 50 || height > 260)
    ) {
      setError('Height must be between 50 and 260 cm.')
      return
    }

    // Weight validation
    if (
      weight !== null &&
      (!Number.isFinite(weight) || weight < 10 || weight > 500)
    ) {
      setError('Weight must be between 10 and 500 kg.')
      return
    }

    // Workout days validation
    if (
      days !== null &&
      (!Number.isInteger(days) || days < 1 || days > 7)
    ) {
      setError('Choose between 1 and 7 workout days per week.')
      return
    }

    // Workout duration validation
    if (
      minutes !== null &&
      (!Number.isInteger(minutes) || minutes < 5 || minutes > 180)
    ) {
      setError('Workout duration must be between 5 and 180 minutes.')
      return
    }

    // Sleep validation
    if (
      sleep !== null &&
      (!Number.isFinite(sleep) || sleep < 0 || sleep > 24)
    ) {
      setError('Sleep hours must be between 0 and 24.')
      return
    }

    // Health limitation validation
    if (
      form.has_health_limitation !== '' &&
      form.has_health_limitation !== 'yes' &&
      form.has_health_limitation !== 'no'
    ) {
      setError('Please select a valid health limitations answer.')
      return
    }

    // Date of birth validation (local date, no UTC conversion)
    if (form.date_of_birth) {
      const datePattern = /^\d{4}-\d{2}-\d{2}$/

      if (!datePattern.test(form.date_of_birth)) {
        setError('Please enter a valid date of birth.')
        return
      }

      const [year, month, day] = form.date_of_birth.split('-').map(Number)

      const selectedDate = new Date(year, month - 1, day)

      // Reject invalid calendar dates such as 31 February.
      if (
        !year ||
        !month ||
        !day ||
        selectedDate.getFullYear() !== year ||
        selectedDate.getMonth() !== month - 1 ||
        selectedDate.getDate() !== day
      ) {
        setError('Please enter a valid date of birth.')
        return
      }

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (selectedDate > today) {
        setError('Date of birth cannot be in the future.')
        return
      }
    }

    setSaving(true)

    try {
      await updateFitnessProfile({
        date_of_birth: form.date_of_birth || null,
        height_cm: height,
        weight_kg: weight,
        fitness_goal: form.fitness_goal,
        experience_level: form.experience_level,
        workout_days_per_week: days,
        workout_weekdays: workoutWeekdays,
        workout_minutes: minutes,
        equipment_level: form.equipment_level,
        dietary_preference: form.dietary_preference,
        sleep_hours: sleep,

        has_health_limitation:
          form.has_health_limitation === ''
            ? null
            : form.has_health_limitation === 'yes',

        safety_notes: form.safety_notes.trim(),
      })

      setSuccess('Your fitness assessment has been saved.')
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not save your fitness assessment.',
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-3 text-white/60">
        <LoaderCircle className="animate-spin" size={20} />
        Loading your fitness profile...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-[#c5f66a]"
      >
        <ArrowLeft size={17} />
        Back to dashboard
      </Link>

      <header>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c5f66a]/10 text-[#c5f66a]">
          <Target size={24} />
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#c5f66a]">
          Your starting point
        </p>

        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Fitness assessment
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
          Tell us about your goals, routine and available equipment. We’ll use
          these details to help shape a plan around your needs.
        </p>
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
          className="flex items-start gap-3 rounded-xl border border-[#c5f66a]/20 bg-[#c5f66a]/10 p-4 text-sm text-[#d6ff8c]"
        >
          <CheckCircle2 size={19} className="shrink-0" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl border border-white/10 bg-[#171a15] p-5 sm:p-7">
          <h3 className="text-lg font-semibold">About you</h3>
          <p className="mt-1 text-sm text-white/45">
            These details help establish your starting point.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="Date of birth">
              <input
                className={inputClass}
                type="date"
                value={form.date_of_birth}
                max={maxBirthDate}
                onChange={(e) => updateField('date_of_birth', e.target.value)}
              />
            </Field>

            <Field label="Height (cm)">
              <input
                className={inputClass}
                type="number"
                min="50"
                max="260"
                step="0.1"
                placeholder="e.g. 170"
                value={form.height_cm}
                onChange={(e) => updateField('height_cm', e.target.value)}
              />
            </Field>

            <Field label="Weight (kg)">
              <input
                className={inputClass}
                type="number"
                min="10"
                max="500"
                step="0.1"
                placeholder="e.g. 65"
                value={form.weight_kg}
                onChange={(e) => updateField('weight_kg', e.target.value)}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#171a15] p-5 sm:p-7">
          <h3 className="text-lg font-semibold">Your fitness goals</h3>
          <p className="mt-1 text-sm text-white/45">
            Choose the goal that best matches what you want to work toward.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="Main goal">
              <select
                className={inputClass}
                value={form.fitness_goal}
                onChange={(e) => updateField('fitness_goal', e.target.value)}
              >
                <option value="">Choose a goal</option>
                <option value="weight_loss">Weight loss</option>
                <option value="muscle_gain">Muscle gain</option>
                <option value="general_fitness">General fitness</option>
                <option value="stamina">Improve stamina</option>
                <option value="flexibility">Flexibility and mobility</option>
              </select>
            </Field>

            <Field label="Experience level">
              <select
                className={inputClass}
                value={form.experience_level}
                onChange={(e) => updateField('experience_level', e.target.value)}
              >
                <option value="">Choose your level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </Field>

            <Field label="Workout days per week">
              <select
                className={inputClass}
                value={form.workout_days_per_week}
                onChange={(e) =>
                  updateField('workout_days_per_week', e.target.value)
                }
              >
                <option value="">Choose days</option>
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <option key={day} value={day}>
                    {day} {day === 1 ? 'day' : 'days'}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Time per workout">
              <select
                className={inputClass}
                value={form.workout_minutes}
                onChange={(e) => updateField('workout_minutes', e.target.value)}
              >
                <option value="">Choose duration</option>
                {[10, 15, 20, 30, 45, 60, 90, 120, 150, 180].map((minute) => (
                  <option key={minute} value={minute}>
                    {minute} minutes
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Available equipment">
              <select
                className={inputClass}
                value={form.equipment_level}
                onChange={(e) => updateField('equipment_level', e.target.value)}
              >
                <option value="">Choose equipment</option>
                <option value="none">No equipment</option>
                <option value="basic">Basic equipment</option>
                <option value="home_gym">Home gym equipment</option>
              </select>
            </Field>

            <Field label="Dietary preference">
              <select
                className={inputClass}
                value={form.dietary_preference}
                onChange={(e) =>
                  updateField('dietary_preference', e.target.value)
                }
              >
                <option value="">Choose preference</option>
                <option value="no_preference">No preference</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="eggetarian">Eggetarian</option>
                <option value="non_vegetarian">Non-vegetarian</option>
              </select>
            </Field>

            <Field label="Average sleep per night">
              <select
                className={inputClass}
                value={form.sleep_hours}
                onChange={(e) => updateField('sleep_hours', e.target.value)}
              >
                <option value="">Choose hours</option>
                {[4, 5, 6, 7, 8, 9, 10, 11, 12].map((hour) => (
                  <option key={hour} value={hour}>
                    {hour} hours
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#171a15] p-5 sm:p-7">
          <h3 className="text-lg font-semibold">Health and safety</h3>
          <p className="mt-1 text-sm leading-6 text-white/45">
            This helps us avoid suggesting activities that may not suit you.
            Share only what you’re comfortable sharing.
          </p>

          <div className="mt-6">
            <Field label="Do you have an injury, health condition, or limitation that may affect exercise?">
              <select
                className={inputClass}
                value={form.has_health_limitation}
                onChange={(e) =>
                  updateField('has_health_limitation', e.target.value)
                }
              >
                <option value="">Choose an answer</option>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </Field>
          </div>

          {form.has_health_limitation === 'yes' && (
            <div className="mt-5">
              <Field label="Optional notes (avoid sharing unnecessary sensitive details)">
                <textarea
                  className={inputClass}
                  rows={4}
                  maxLength={1000}
                  placeholder="Any movements you need to avoid or adaptations you may need..."
                  value={form.safety_notes}
                  onChange={(e) => updateField('safety_notes', e.target.value)}
                />
              </Field>
            </div>
          )}
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-xs leading-5 text-white/40">
            Your answers help personalise guidance; they are not a medical
            diagnosis. Stop exercising if you experience concerning symptoms.
          </p>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#c5f66a] px-6 py-3.5 text-sm font-semibold text-[#10120f] transition hover:bg-[#d6ff8c] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {saving ? 'Saving assessment...' : 'Save assessment'}
          </button>
        </div>
      </form>
    </div>
  )
}
