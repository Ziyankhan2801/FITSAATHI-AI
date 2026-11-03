
import { useEffect, useState, type FormEvent } from 'react'
import {
  Activity,
  Plus,
  Ruler,
  Scale,
  Trash2,
  Camera,
  ShieldCheck,
  Upload,
  Image as ImageIcon,
} from 'lucide-react'

import {
  getBodyMeasurements,
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
  const [profile, setProfile] = useState<FitnessProfile | null>(null)
  const [form, setForm] = useState(emptyForm)

  const [consents, setConsents] = useState<PrivacyConsent[]>([])
  const [photos, setPhotos] = useState<ProgressPhoto[]>([])
  const [photoImages, setPhotoImages] = useState<Record<number, string>>({})

  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [photoAngle, setPhotoAngle] = useState<PhotoAngle>('front')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
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
    setError('')

    try {
      const [measurementData, profileData, consentData, photoData] =
        await Promise.all([
          getBodyMeasurements(),
          getFitnessProfile(),
          getPrivacyConsents(),
          getProgressPhotos(),
        ])

      setMeasurements(measurementData)
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
      setError(
        err instanceof Error ? err.message : 'Could not load progress data.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()

    return () => {
      setPhotoImages((previous) => {
        Object.values(previous).forEach((url) => URL.revokeObjectURL(url))
        return {}
      })
    }
  }, [])

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

      {/* Measurement form */}
      <section className="rounded-2xl border border-white/10 bg-[#171a15] p-5 sm:p-7">
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
                max={new Date().toLocaleDateString('en-CA')}
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
          <p className="mt-5 rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-white/45">
            No measurements yet. Add your first measurement above.
          </p>
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
            <div className="mt-4 rounded-xl border border-dashed border-white/15 p-8 text-center">
              <ImageIcon className="mx-auto text-white/35" size={28} />
              <p className="mt-3 text-sm text-white/45">
                No progress photos uploaded yet.
              </p>
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
    </div>
  )
}
