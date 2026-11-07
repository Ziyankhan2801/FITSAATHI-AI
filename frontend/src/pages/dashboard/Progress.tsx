import { useEffect, useState, type FormEvent } from 'react'
import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'
import EmptyState from '../../components/common/EmptyState'
import {
  Activity,
  Plus,
  Ruler,
  Scale,
  Trash2,
  Camera,
  ShieldCheck,
  Upload,
} from 'lucide-react'

import {
  getBodyMeasurements,
  getWorkoutHistory,
  createBodyMeasurement,
  deleteBodyMeasurement,
  getFitnessProfile,
  getPrivacyConsents,
  updatePrivacyConsent,
  getProgressPhotos,
  uploadProgressPhoto,
  deleteProgressPhoto,
  getProgressPhotoImageUrl,
  type BodyMeasurement,
  type FitnessProfile,
  type PrivacyConsent,
  type PhotoAngle,
  type ProgressPhoto,
} from '../../services/api'

const emptyForm = {
  measurement_date: new Date().toLocaleDateString('en-CA'),
  weight_kg: '',
  waist_cm: '',
  chest_cm: '',
  hips_cm: '',
  left_arm_cm: '',
  right_arm_cm: '',
  left_thigh_cm: '',
  right_thigh_cm: '',
}

const inputClass =
  'w-full rounded-xl border border-white/10 bg-[#10120f] px-4 py-3 text-sm text-white outline-none transition focus:border-[#c5f66a]'

const labelClass = 'mb-2 block text-xs font-medium text-white/55'

export default function Progress() {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([])
  const [workoutHistory, setWorkoutHistory] = useState<Awaited<ReturnType<typeof getWorkoutHistory>>>([])
  const [profile, setProfile] = useState<FitnessProfile | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [maxMeasurementDate] = useState(() =>
    new Date().toLocaleDateString('en-CA'),
  )

  const [consents, setConsents] = useState<PrivacyConsent[]>([])
  const [photos, setPhotos] = useState<ProgressPhoto[]>([])
  const [photoImages, setPhotoImages] = useState<Record<number, string>>({})

  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [photoAngle, setPhotoAngle] = useState<PhotoAngle>('front')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [retryKey, setRetryKey] = useState(0)
  const [success, setSuccess] = useState('')

  const photoConsent =
    consents.find((item) => item.consent_type === 'photo_storage')
      ?.is_granted ?? false

  const aiConsent =
    consents.find((item) => item.consent_type === 'ai_analysis')
      ?.is_granted ?? false

  async function loadPhotoImages(photoList: ProgressPhoto[]) {
    const entries = await Promise.all(
      photoList.map(async (photo) => {
        try {
          const response = await fetch(getProgressPhotoImageUrl(photo.id), {
            credentials: 'include',
          })

          if (!response.ok) return null

          const blob = await response.blob()
          return [photo.id, URL.createObjectURL(blob)] as const
        } catch {
          return null
        }
      }),
    )

    const nextImages: Record<number, string> = {}

    entries.forEach((entry) => {
      if (entry) nextImages[entry[0]] = entry[1]
    })

    setPhotoImages((previous) => {
      Object.values(previous).forEach((url) => URL.revokeObjectURL(url))
      return nextImages
    })
  }

  async function loadData() {
    setLoading(true)
    setLoadError('')
    setError('')

    try {
      const [measurementData, profileData, consentData, photoData, workoutData] =
        await Promise.all([
          getBodyMeasurements(),
          getFitnessProfile(),
          getPrivacyConsents(),
          getProgressPhotos(),
          getWorkoutHistory(),
        ])

      setMeasurements(measurementData)
      setWorkoutHistory(workoutData)
      setProfile(profileData)
      setConsents(consentData)
      setPhotos(photoData)

      if (
        consentData.some(
          (item) =>
            item.consent_type === 'photo_storage' && item.is_granted,
        )
      ) {
        await loadPhotoImages(photoData)
      } else {
        setPhotoImages((previous) => {
          Object.values(previous).forEach((url) => URL.revokeObjectURL(url))
          return {}
        })
      }
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Could not load progress data.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    async function loadInitialData() {
      try {
        const [
          measurementData,
          profileData,
          consentData,
          photoData,
          workoutData,
        ] = await Promise.all([
          getBodyMeasurements(),
          getFitnessProfile(),
          getPrivacyConsents(),
          getProgressPhotos(),
          getWorkoutHistory(),
        ])

        if (!active) return

        setMeasurements(measurementData)
        setWorkoutHistory(workoutData)
        setProfile(profileData)
        setConsents(consentData)
        setPhotos(photoData)

        const canLoadPhotos = consentData.some(
          (item) =>
            item.consent_type === 'photo_storage' && item.is_granted,
        )

        if (canLoadPhotos) {
          const entries = await Promise.all(
            photoData.map(async (photo) => {
              try {
                const response = await fetch(
                  getProgressPhotoImageUrl(photo.id),
                  { credentials: 'include' },
                )

                if (!response.ok) return null

                const blob = await response.blob()
                return [photo.id, URL.createObjectURL(blob)] as const
              } catch {
                return null
              }
            }),
          )

          const nextImages: Record<number, string> = {}
          entries.forEach((entry) => {
            if (entry) nextImages[entry[0]] = entry[1]
          })

          if (!active) {
            Object.values(nextImages).forEach((url) =>
              URL.revokeObjectURL(url),
            )
            return
          }

          setPhotoImages(nextImages)
        } else {
          setPhotoImages({})
        }
      } catch (err) {
        if (active) {
          setLoadError(
            err instanceof Error
              ? err.message
              : 'Could not load progress data.',
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadInitialData()

    return () => {
      active = false
    }
  }, [retryKey])

  useEffect(() => {
    return () => {
      Object.values(photoImages).forEach((url) => URL.revokeObjectURL(url))
    }
  }, [photoImages])

  const latestMeasurement = measurements[0]
  const previousMeasurement = measurements[1]

  const heightInMeters = profile?.height_cm
    ? Number(profile.height_cm) / 100
    : 0

  const currentWeight = latestMeasurement
    ? Number(latestMeasurement.weight_kg)
    : profile?.weight_kg
      ? Number(profile.weight_kg)
      : 0

  const bmi =
    heightInMeters > 0 && currentWeight > 0
      ? currentWeight / (heightInMeters * heightInMeters)
      : null

  const weightChange =
    latestMeasurement && previousMeasurement
      ? Number(latestMeasurement.weight_kg) -
        Number(previousMeasurement.weight_kg)
      : null

  // Sort a copy for charts; API history is displayed newest-first elsewhere.
  const chartMeasurements = [...measurements]
    .filter((item) => Number.isFinite(Number(item.weight_kg)))
    .sort(
      (a, b) =>
        new Date(`${a.measurement_date}T00:00:00`).getTime() -
        new Date(`${b.measurement_date}T00:00:00`).getTime(),
    )
    .slice(-8)

  const weightValues = chartMeasurements.map((item) => Number(item.weight_kg))
  const weightMin = weightValues.length ? Math.min(...weightValues) : 0
  const weightMax = weightValues.length ? Math.max(...weightValues) : 0
  const weightRange = Math.max(weightMax - weightMin, 1)
  const workoutCount = workoutHistory.length
  const averageCompletion = workoutCount
    ? Math.round(
        workoutHistory.reduce(
          (total, session) => total + Number(session.completion_percentage || 0),
          0,
        ) / workoutCount,
      )
    : 0
  const latestWorkout = workoutHistory[0]
  const waistValues = chartMeasurements
    .filter((item) => item.waist_cm !== null && item.waist_cm !== undefined)
    .map((item) => Number(item.waist_cm))
  const waistChange =
    waistValues.length >= 2
      ? waistValues[waistValues.length - 1] - waistValues[0]
      : null

  const progressInsight =
    workoutCount === 0
      ? 'Complete and save your first workout to unlock activity insights.'
      : averageCompletion < 70
        ? 'Try choosing a manageable workout length and completing each planned session at your own pace.'
        : workoutCount < 3
          ? 'Good start. Build consistency by recording your next few planned workouts.'
          : 'You have a workout history to build on. Keep your schedule consistent and compare measurements over time.'

  function updateField(field: keyof typeof emptyForm, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await createBodyMeasurement({
        measurement_date: form.measurement_date,
        weight_kg: Number(form.weight_kg),
        waist_cm: form.waist_cm ? Number(form.waist_cm) : null,
        chest_cm: form.chest_cm ? Number(form.chest_cm) : null,
        hips_cm: form.hips_cm ? Number(form.hips_cm) : null,
        left_arm_cm: form.left_arm_cm ? Number(form.left_arm_cm) : null,
        right_arm_cm: form.right_arm_cm ? Number(form.right_arm_cm) : null,
        left_thigh_cm: form.left_thigh_cm ? Number(form.left_thigh_cm) : null,
        right_thigh_cm: form.right_thigh_cm ? Number(form.right_thigh_cm) : null,
      })

      setForm(emptyForm)
      setSuccess('Your measurements have been saved.')
      await loadData()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save measurements.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteMeasurement(id: number) {
    if (!window.confirm('Delete this measurement record?')) return

    setError('')
    setSuccess('')

    try {
      await deleteBodyMeasurement(id)
      setMeasurements((previous) =>
        previous.filter((measurement) => measurement.id !== id),
      )
      setSuccess('Measurement deleted successfully.')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not delete measurement.',
      )
    }
  }

  async function handleConsentChange(
    consentType: 'photo_storage' | 'ai_analysis',
    granted: boolean,
  ) {
    if (
      !granted &&
      consentType === 'photo_storage' &&
      !window.confirm(
        'Withdraw photo storage consent? Your stored progress photos may be deleted.',
      )
    ) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await updatePrivacyConsent(consentType, granted)
      setSuccess(
        granted ? 'Consent granted successfully.' : 'Consent withdrawn.',
      )
      await loadData()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not update privacy consent.',
      )
    }
  }

  async function handlePhotoUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedPhoto) {
      setError('Please select an image first.')
      return
    }

    if (!photoConsent) {
      setError('Please grant photo storage consent before uploading.')
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      await uploadProgressPhoto(selectedPhoto, photoAngle)
      setSelectedPhoto(null)
      setSuccess('Progress photo uploaded successfully.')
      await loadData()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not upload progress photo.',
      )
    } finally {
      setUploading(false)
    }
  }

  async function handleDeletePhoto(id: number) {
    if (!window.confirm('Permanently delete this progress photo?')) return

    setError('')
    setSuccess('')

    try {
      await deleteProgressPhoto(id)
      setPhotos((previous) => previous.filter((photo) => photo.id !== id))

      setPhotoImages((previous) => {
        const next = { ...previous }
        if (next[id]) URL.revokeObjectURL(next[id])
        delete next[id]
        return next
      })

      setSuccess('Progress photo deleted.')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not delete progress photo.',
      )
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section>
        <p className="text-sm font-medium text-[#c5f66a]">YOUR JOURNEY</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Your Progress
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/50">
          Track your measurements, photos and improvements over time.
        </p>
      </section>

      {loading ? (
        <LoadingState
          title="Loading your progress"
          description="Fetching your measurements, workout history and progress photos..."
        />
      ) : loadError ? (
        <ErrorState
          title="Could not load progress"
          message={loadError}
          onRetry={() => {
            setLoading(true)
            setLoadError('')
            setRetryKey((value) => value + 1)
          }}
          retryLabel="Try again"
        />
      ) : (
        <>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300"
        >
          {error}
        </p>
      )}

      {success && (
        <p
          role="status"
          className="rounded-xl border border-[#c5f66a]/20 bg-[#c5f66a]/10 p-4 text-sm text-[#c5f66a]"
        >
          {success}
        </p>
      )}

      {/* Progress overview */}
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-[#171a15] p-5">
          <Scale className="text-[#c5f66a]" size={22} />
          <p className="mt-4 text-sm text-white/50">Current weight</p>
          <p className="mt-2 text-3xl font-bold">
            {loading ? '—' : currentWeight ? `${currentWeight} kg` : 'Not set'}
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[#171a15] p-5">
          <Activity className="text-[#c5f66a]" size={22} />
          <p className="mt-4 text-sm text-white/50">BMI estimate</p>
          <p className="mt-2 text-3xl font-bold">
            {loading ? '—' : bmi ? bmi.toFixed(1) : 'Not available'}
          </p>
          <p className="mt-2 text-xs text-white/35">
            Screening indicator, not a medical diagnosis
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[#171a15] p-5">
          <Ruler className="text-[#c5f66a]" size={22} />
          <p className="mt-4 text-sm text-white/50">Weight change</p>
          <p className="mt-2 text-3xl font-bold">
            {loading
              ? '—'
              : weightChange === null
                ? '—'
                : `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg`}
          </p>
          <p className="mt-2 text-xs text-white/35">
            Compared with your previous measurement
          </p>
        </article>
      </section>

      {/* Level 10: progress analytics */}
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-[#171a15] p-5 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Weight trend</h2>
              <p className="mt-1 text-sm text-white/45">Your latest measurement records</p>
            </div>
            <Activity className="text-[#c5f66a]" size={22} />
          </div>

          {loading ? (
            <p className="mt-8 text-sm text-white/45">Loading trend...</p>
          ) : chartMeasurements.length < 2 ? (
            <p className="mt-8 rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-white/45">
              Add at least two weight records to see your trend.
            </p>
          ) : (
            <div className="mt-6">
              <div className="mb-3 flex justify-between text-xs text-white/45">
                <span>{weightMax.toFixed(1)} kg</span>
                <span>{weightMin.toFixed(1)} kg</span>
              </div>
              <svg viewBox="0 0 600 190" role="img" aria-label="Weight trend chart" className="h-44 w-full overflow-visible">
                {[25, 70, 115, 160].map((y) => (
                  <line key={y} x1="12" x2="588" y1={y} y2={y} stroke="currentColor" opacity="0.12" strokeDasharray="4 6" />
                ))}
                <polyline
                  fill="none"
                  stroke="#c5f66a"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={weightValues.map((value, index) => {
                    const x = 18 + (index * 564) / Math.max(weightValues.length - 1, 1)
                    const y = 160 - ((value - weightMin) / weightRange) * 125
                    return `${x},${y}`
                  }).join(' ')}
                />
                {weightValues.map((value, index) => {
                  const x = 18 + (index * 564) / Math.max(weightValues.length - 1, 1)
                  const y = 160 - ((value - weightMin) / weightRange) * 125
                  return <circle key={`${chartMeasurements[index].id}-weight`} cx={x} cy={y} r="5" fill="#c5f66a" />
                })}
              </svg>
              <div className="mt-2 flex justify-between text-xs text-white/40">
                <span>{new Date(`${chartMeasurements[0].measurement_date}T00:00:00`).toLocaleDateString()}</span>
                <span>{new Date(`${chartMeasurements[chartMeasurements.length - 1].measurement_date}T00:00:00`).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-white/10 bg-[#171a15] p-5 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Workout activity</h2>
              <p className="mt-1 text-sm text-white/45">Based on saved workout history</p>
            </div>
            <Ruler className="text-[#c5f66a]" size={22} />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#10120f] p-4">
              <p className="text-xs text-white/45">Saved workouts</p>
              <p className="mt-2 text-3xl font-bold">{loading ? '—' : workoutCount}</p>
            </div>
            <div className="rounded-xl bg-[#10120f] p-4">
              <p className="text-xs text-white/45">Avg. completion</p>
              <p className="mt-2 text-3xl font-bold">{loading ? '—' : `${averageCompletion}%`}</p>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-white/10 p-4">
            <p className="text-xs font-semibold text-[#c5f66a]">LATEST SESSION</p>
            {latestWorkout ? (
              <>
                <p className="mt-2 font-medium">{latestWorkout.workout_title}</p>
                <p className="mt-1 text-xs text-white/45">
                  {latestWorkout.completion_percentage}% complete
                  {latestWorkout.completed_at
                    ? ` · ${new Date(latestWorkout.completed_at).toLocaleDateString()}`
                    : ''}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-white/45">No saved workouts yet.</p>
            )}
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-[#c5f66a]/15 bg-[#171a15] p-5 sm:p-7">
        <p className="text-xs font-semibold tracking-wide text-[#c5f66a]">PROGRESS INSIGHT</p>
        <h2 className="mt-2 text-lg font-semibold">Your next step</h2>
        <p className="mt-2 text-sm leading-6 text-white/55">{loading ? 'Preparing your insight...' : progressInsight}</p>
        {waistChange !== null && (
          <p className="mt-3 text-xs text-white/40">
            Waist measurement change across available records: {waistChange > 0 ? '+' : ''}{waistChange.toFixed(1)} cm. This is a measurement comparison, not a health assessment.
          </p>
        )}
        <p className="mt-3 text-xs text-white/35">
          Insights use saved records only. They are simple progress prompts, not medical advice or an AI-generated training prescription.
        </p>
      </section>

      {/* Measurement form */}
      <section
        id="measurement-form"
        className="rounded-2xl border border-white/10 bg-[#171a15] p-5 sm:p-7"
      >
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Add body measurements</h2>
          <p className="mt-2 text-sm text-white/45">
            Enter your measurements to keep a record of your progress.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Measurement date</label>
              <input
                type="date"
                required
                max={maxMeasurementDate}
                value={form.measurement_date}
                onChange={(e) =>
                  updateField('measurement_date', e.target.value)
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Weight (kg) *</label>
              <input
                type="number"
                required
                min="10"
                max="500"
                step="0.01"
                placeholder="e.g. 65"
                value={form.weight_kg}
                onChange={(e) => updateField('weight_kg', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-[#c5f66a]">
              Body measurements (cm)
            </h3>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {([
                ['waist_cm', 'Waist'],
                ['chest_cm', 'Chest'],
                ['hips_cm', 'Hips'],
                ['left_arm_cm', 'Left arm'],
                ['right_arm_cm', 'Right arm'],
                ['left_thigh_cm', 'Left thigh'],
                ['right_thigh_cm', 'Right thigh'],
              ] as const).map(([field, label]) => (
                <div key={field}>
                  <label className={labelClass}>{label} (cm)</label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    step="0.01"
                    placeholder="Optional"
                    value={form[field]}
                    onChange={(e) => updateField(field, e.target.value)}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-[#c5f66a] px-6 py-3 text-sm font-semibold text-[#10120f] transition hover:bg-[#d6ff8c] disabled:opacity-50"
          >
            <Plus size={17} />
            {saving ? 'Saving...' : 'Save measurements'}
          </button>
        </form>
      </section>

      {/* Measurement history */}
      <section className="rounded-2xl border border-white/10 bg-[#171a15] p-5 sm:p-7">
        <h2 className="text-xl font-semibold">Measurement history</h2>
        <p className="mt-2 text-sm text-white/45">
          Your previously saved measurement records.
        </p>

        {loading ? (
          <p className="mt-5 text-sm text-white/45">Loading measurements...</p>
        ) : measurements.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title="No measurements yet"
              description="Add your first body measurement to start tracking your fitness progress."
              actionLabel="Add measurement"
              onAction={() =>
                document
                  .querySelector('#measurement-form')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            />
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {measurements.map((measurement) => (
              <article
                key={measurement.id}
                className="flex flex-col justify-between gap-4 rounded-xl border border-white/10 bg-[#10120f] p-4 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="font-semibold">
                    {new Date(
                      `${measurement.measurement_date}T00:00:00`,
                    ).toLocaleDateString()}
                  </p>
                  <p className="mt-2 text-sm text-white/50">
                    Weight: {measurement.weight_kg} kg
                    {measurement.waist_cm !== null &&
                      ` · Waist: ${measurement.waist_cm} cm`}
                    {measurement.chest_cm !== null &&
                      ` · Chest: ${measurement.chest_cm} cm`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void handleDeleteMeasurement(measurement.id)}
                  className="inline-flex items-center gap-2 self-start rounded-lg border border-red-400/20 px-3 py-2 text-xs text-red-300 hover:bg-red-400/10 sm:self-auto"
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Privacy controls */}
      <section className="rounded-2xl border border-white/10 bg-[#171a15] p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-[#c5f66a]" size={23} />
          <div>
            <h2 className="text-xl font-semibold">Privacy controls</h2>
            <p className="mt-1 text-sm text-white/45">
              You control how your progress data is stored and used.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex flex-col justify-between gap-4 rounded-xl border border-white/10 bg-[#10120f] p-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-semibold">Progress photo storage</h3>
              <p className="mt-1 max-w-xl text-xs leading-5 text-white/45">
                Allow FitSaathi AI to store your progress photos privately.
                Withdrawing this consent may delete stored photos.
              </p>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() => void handleConsentChange('photo_storage', !photoConsent)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold ${
                photoConsent
                  ? 'border border-[#c5f66a]/30 bg-[#c5f66a]/10 text-[#c5f66a]'
                  : 'bg-[#c5f66a] text-[#10120f]'
              }`}
            >
              {photoConsent ? 'Granted · Withdraw' : 'Grant consent'}
            </button>
          </div>

          <div className="flex flex-col justify-between gap-4 rounded-xl border border-white/10 bg-[#10120f] p-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-semibold">AI photo analysis</h3>
              <p className="mt-1 max-w-xl text-xs leading-5 text-white/45">
                Give separate permission for future AI-based photo analysis.
                Granting this consent does not start an AI analysis.
              </p>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() => void handleConsentChange('ai_analysis', !aiConsent)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold ${
                aiConsent
                  ? 'border border-[#c5f66a]/30 bg-[#c5f66a]/10 text-[#c5f66a]'
                  : 'bg-[#c5f66a] text-[#10120f]'
              }`}
            >
              {aiConsent ? 'Granted · Withdraw' : 'Grant consent'}
            </button>
          </div>
        </div>
      </section>

      {/* Progress photo upload */}
      <section className="rounded-2xl border border-white/10 bg-[#171a15] p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <Camera className="text-[#c5f66a]" size={23} />
          <div>
            <h2 className="text-xl font-semibold">Progress photos</h2>
            <p className="mt-1 text-sm text-white/45">
              Privately save photos to compare your fitness journey over time.
            </p>
          </div>
        </div>

        {!photoConsent ? (
          <p className="mt-5 rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-4 text-sm text-yellow-200">
            Grant Progress Photo Storage consent above before uploading photos.
          </p>
        ) : (
          <form
            onSubmit={handlePhotoUpload}
            className="mt-6 grid gap-5 sm:grid-cols-2"
          >
            <div>
              <label className={labelClass}>Photo angle</label>
              <select
                value={photoAngle}
                onChange={(e) => setPhotoAngle(e.target.value as PhotoAngle)}
                className={inputClass}
              >
                <option value="front">Front</option>
                <option value="side">Side</option>
                <option value="back">Back</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Choose photo (max 5 MB)</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={(e) => setSelectedPhoto(e.target.files?.[0] ?? null)}
                className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-[#c5f66a] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#10120f]`}
              />
            </div>

            <button
              type="submit"
              disabled={uploading || !selectedPhoto}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#c5f66a] px-6 py-3 text-sm font-semibold text-[#10120f] disabled:opacity-50 sm:col-span-2 sm:justify-self-start"
            >
              <Upload size={17} />
              {uploading ? 'Uploading...' : 'Upload progress photo'}
            </button>
          </form>
        )}

        <div className="mt-8">
          <h3 className="font-semibold">Your photo gallery</h3>

          {!photoConsent ? (
            <p className="mt-4 text-sm text-white/45">
              Photo gallery is unavailable while photo storage consent is withdrawn.
            </p>
          ) : loading ? (
            <p className="mt-4 text-sm text-white/45">Loading photos...</p>
          ) : photos.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No progress photos yet"
                description="Upload your first progress photo to start comparing your fitness journey over time."
              />
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {photos.map((photo) => (
                <article
                  key={photo.id}
                  className="overflow-hidden rounded-xl border border-white/10 bg-[#10120f]"
                >
                  {photoImages[photo.id] ? (
                    <img
                      src={photoImages[photo.id]}
                      alt={`${photo.photo_angle} progress photo`}
                      className="aspect-[3/4] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[3/4] items-center justify-center text-xs text-white/40">
                      Image unavailable
                    </div>
                  )}

                  <div className="p-3">
                    <p className="text-sm font-semibold capitalize">
                      {photo.photo_angle}
                    </p>
                    <p className="mt-1 text-xs text-white/40">
                      {new Date(photo.uploaded_at).toLocaleDateString()}
                    </p>

                    <button
                      type="button"
                      onClick={() => void handleDeletePhoto(photo.id)}
                      className="mt-3 inline-flex items-center gap-2 text-xs text-red-300 hover:text-red-200"
                    >
                      <Trash2 size={14} />
                      Delete photo
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
        </>
      )}
    </div>
  )
}
