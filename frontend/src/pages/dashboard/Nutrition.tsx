import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Apple,
  Beef,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CirclePlus,
  Clock3,
  Coffee,
  Droplets,
  Flame,
  Leaf,
  Loader2,
  Minus,
  Plus,
  Search,
  Settings2,
  Trash2,
  Utensils,
  Wheat,
  X,
  Moon,
  GlassWater,
} from 'lucide-react'

import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'
import EmptyState from '../../components/common/EmptyState'

import {
  createMealEntry,
  deleteMealEntry,
  getFoodItems,
  getNutritionSummary,
  getNutritionTargets,
  createNutritionSettings,
  updateNutritionSettings,
  getWaterIntake,
  createWaterIntake,
  deleteWaterIntake,
  getSleepLogs,
  createSleepLog,
  deleteSleepLog,
  type FoodCategory,
  type FoodItem,
  type MealEntry,
  type MealType,
  type NutritionSummary,
  type NutritionTargets,
  type NutritionSettingsData,
  type BiologicalSex,
  type ActivityLevel,
  type WaterIntake,
  type SleepLog,
  type SleepQuality,
} from '../../services/api'

const categoryOptions: {
  value: FoodCategory | ''
  label: string
}[] = [
  { value: '', label: 'All Foods' },
  { value: 'grains', label: 'Grains' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'fruits', label: 'Fruits' },
  { value: 'vegetables', label: 'Vegetables' },
  { value: 'protein', label: 'Protein' },
  { value: 'nuts', label: 'Nuts & Seeds' },
  { value: 'legumes', label: 'Legumes' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'other', label: 'Other' },
]

const mealOptions: {
  value: MealType
  label: string
}[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snacks' },
]

const mealIcons = {
  breakfast: Coffee,
  lunch: Utensils,
  dinner: Utensils,
  snack: Apple,
}

const activityOptions: {
  value: ActivityLevel
  label: string
}[] = [
  { value: 'sedentary', label: 'Sedentary — little activity' },
  { value: 'light', label: 'Light — 1–3 days/week' },
  { value: 'moderate', label: 'Moderate — 3–5 days/week' },
  { value: 'very', label: 'Very active — 6–7 days/week' },
  { value: 'extra', label: 'Extremely active — intense activity' },
]

function getLocalDate() {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  return new Date(now.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 10)
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function numberValue(value: string | number | undefined | null) {
  return Number(value ?? 0)
}

function percentage(value: number, target: number) {
  if (!target || target <= 0) return 0
  return Math.min(100, Math.max(0, (value / target) * 100))
}

function NutritionCard({
  title,
  value,
  target,
  unit,
  icon: Icon,
  description,
}: {
  title: string
  value: number
  target?: number
  unit: string
  icon: typeof Flame
  description: string
}) {
  const progress = target ? percentage(value, target) : 0

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-400/10 text-orange-400">
          <Icon size={21} />
        </div>
        <span className="text-xs text-slate-500">{description}</span>
      </div>

      <p className="mt-5 text-sm text-slate-400">{title}</p>

      <p className="mt-1 text-2xl font-bold text-white">
        {value.toFixed(1)}
        <span className="ml-1 text-sm font-medium text-slate-400">
          {unit}
        </span>
      </p>

      {target !== undefined && (
        <>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-orange-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Target: {target.toFixed(0)} {unit}
          </p>
        </>
      )}
    </div>
  )
}

function SectionHeading({
  title,
  description,
  icon: Icon,
}: {
  title: string
  description: string
  icon: typeof Flame
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-400/10 text-orange-400">
        <Icon size={20} />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      </div>
    </div>
  )
}

export default function Nutrition() {
  const [selectedDate, setSelectedDate] = useState(getLocalDate())

  const [summary, setSummary] = useState<NutritionSummary | null>(null)
  const [foods, setFoods] = useState<FoodItem[]>([])
  const [targets, setTargets] = useState<NutritionTargets | null>(null)

  const [waterLogs, setWaterLogs] = useState<WaterIntake[]>([])
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([])

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<FoodCategory | ''>('')

  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [quantity, setQuantity] = useState('100')
  const [mealType, setMealType] = useState<MealType>('breakfast')
  const [notes, setNotes] = useState('')

  const [biologicalSex, setBiologicalSex] = useState<BiologicalSex>('male')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate')
  const [manualCalories, setManualCalories] = useState('')
  const [manualProtein, setManualProtein] = useState('')

  const [waterAmount, setWaterAmount] = useState('250')
  const [sleepHours, setSleepHours] = useState('8')
  const [sleepMinutes, setSleepMinutes] = useState('0')
  const [sleepQuality, setSleepQuality] = useState<SleepQuality>('good')
  const [sleepNotes, setSleepNotes] = useState('')

  const [loading, setLoading] = useState(true)
  const [foodsLoading, setFoodsLoading] = useState(true)
  const [targetsLoading, setTargetsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [waterSaving, setWaterSaving] = useState(false)
  const [sleepSaving, setSleepSaving] = useState(false)

  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [deletingWaterId, setDeletingWaterId] = useState<number | null>(null)
  const [deletingSleepId, setDeletingSleepId] = useState<number | null>(null)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [summaryError, setSummaryError] = useState('')
  const [foodsError, setFoodsError] = useState('')
  const [targetsError, setTargetsError] = useState('')
  const [wellnessError, setWellnessError] = useState('')
  const [summaryRetry, setSummaryRetry] = useState(0)
  const [foodsRetry, setFoodsRetry] = useState(0)
  const [targetsRetry, setTargetsRetry] = useState(0)
  const [wellnessRetry, setWellnessRetry] = useState(0)

  const loadSummary = useCallback(async () => {
    const data = await getNutritionSummary(selectedDate)
    setSummary(data)
    setSummaryError('')
  }, [selectedDate])

  const loadTargets = useCallback(async () => {
    setTargetsLoading(true)

    try {
      const data = await getNutritionTargets()

      setTargetsError('')
      if (data.configured) {
        setTargets(data)

        if (data.settings) {
          setBiologicalSex(data.settings.biological_sex)
          setActivityLevel(data.settings.activity_level)
          setManualCalories(
            data.settings.manual_calorie_target?.toString() ?? '',
          )
          setManualProtein(
            data.settings.manual_protein_target_g?.toString() ?? '',
          )
        }
      } else {
        setTargets(null)
      }
    } catch (err) {
      setTargetsError(
        err instanceof Error ? err.message : 'Unable to load nutrition targets.',
      )
    } finally {
      setTargetsLoading(false)
    }
  }, [])

  const loadWellness = useCallback(async () => {
    try {
      const [water, sleep] = await Promise.all([
        getWaterIntake(selectedDate),
        getSleepLogs(selectedDate),
      ])

      setWaterLogs(water)
      setSleepLogs(sleep)
      setWellnessError('')
    } catch (err) {
      setWellnessError(
        err instanceof Error ? err.message : 'Unable to load wellness records.',
      )
    }
  }, [selectedDate])

  useEffect(() => {
    let active = true

    async function loadData() {
      setLoading(true)
      setSummaryError('')

      try {
        const data = await getNutritionSummary(selectedDate)
        if (active) setSummary(data)
      } catch (err) {
        if (active) {
          setSummaryError(
            err instanceof Error ? err.message : 'Unable to load nutrition summary.',
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
  }, [selectedDate, summaryRetry])

  useEffect(() => {
    let active = true

    async function loadFoods() {
      setFoodsLoading(true)
      setFoodsError('')

      try {
        const data = await getFoodItems({ search, category })
        if (active) setFoods(data)
      } catch (err) {
        if (active) {
          setFoodsError(
            err instanceof Error ? err.message : 'Unable to load food items.',
          )
        }
      } finally {
        if (active) setFoodsLoading(false)
      }
    }

    void loadFoods()

    return () => {
      active = false
    }
  }, [search, category, foodsRetry])

  // Load nutrition targets on mount and when the user retries.
  // The initial loading state is already true, so the effect does not
  // synchronously update state before starting the request.
  useEffect(() => {
    let active = true

    async function fetchTargets() {
      try {
        const data = await getNutritionTargets()

        if (!active) return

        setTargetsError('')
        if (data.configured) {
          setTargets(data)

          if (data.settings) {
            setBiologicalSex(data.settings.biological_sex)
            setActivityLevel(data.settings.activity_level)
            setManualCalories(
              data.settings.manual_calorie_target?.toString() ?? '',
            )
            setManualProtein(
              data.settings.manual_protein_target_g?.toString() ?? '',
            )
          }
        } else {
          setTargets(null)
        }
      } catch (err) {
        if (active) {
          setTargetsError(
            err instanceof Error
              ? err.message
              : 'Unable to load nutrition targets.',
          )
        }
      } finally {
        if (active) {
          setTargetsLoading(false)
        }
      }
    }

    void fetchTargets()

    return () => {
      active = false
    }
  }, [targetsRetry])

  // Load water and sleep records for the selected date.
  useEffect(() => {
    let active = true

    async function fetchWellness() {
      try {
        const [water, sleep] = await Promise.all([
          getWaterIntake(selectedDate),
          getSleepLogs(selectedDate),
        ])

        if (active) {
          setWaterLogs(water)
          setSleepLogs(sleep)
          setWellnessError('')
        }
      } catch (err) {
        if (active) {
          setWellnessError(
            err instanceof Error
              ? err.message
              : 'Unable to load wellness records.',
          )
        }
      }
    }

    void fetchWellness()

    return () => {
      active = false
    }
  }, [selectedDate, wellnessRetry])

  const mealsByType = useMemo(() => {
    const grouped: Record<MealType, MealEntry[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    }

    summary?.meals.forEach((meal) => {
      grouped[meal.meal_type].push(meal)
    })

    return grouped
  }, [summary])

  const previewNutrition = useMemo(() => {
    if (!selectedFood || !quantity || Number(quantity) <= 0) return null

    const serving = numberValue(selectedFood.serving_size_g)
    if (serving <= 0) return null

    const multiplier = Number(quantity) / serving

    return {
      calories: numberValue(selectedFood.calories) * multiplier,
      protein: numberValue(selectedFood.protein_g) * multiplier,
      carbs: numberValue(selectedFood.carbohydrates_g) * multiplier,
      fat: numberValue(selectedFood.fat_g) * multiplier,
    }
  }, [selectedFood, quantity])

  const totals = summary?.totals
  const waterTotal = waterLogs.reduce(
    (total, log) => total + numberValue(log.amount_ml),
    0,
  )

  const sleepTotalMinutes = sleepLogs.reduce(
    (total, log) => total + numberValue(log.duration_minutes),
    0,
  )

  const sleepTotalHours = sleepTotalMinutes / 60
  const waterTarget = targets?.water_ml ?? 0

  async function handleAddMeal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedFood) {
      setError('Please select a food item first.')
      return
    }

    const quantityValue = Number(quantity)

    if (
      !Number.isFinite(quantityValue) ||
      quantityValue < 1 ||
      quantityValue > 10000
    ) {
      setError('Enter a quantity between 1g and 10000g.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await createMealEntry({
        food: selectedFood.id,
        meal_type: mealType,
        quantity_g: quantityValue,
        meal_date: selectedDate,
        notes,
      })

      await loadSummary()

      setSuccess(`${selectedFood.name} added successfully.`)
      setSelectedFood(null)
      setQuantity('100')
      setNotes('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save meal.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteMeal(meal: MealEntry) {
    if (!window.confirm(`Delete ${meal.food_name} from your meal history?`)) {
      return
    }

    setDeletingId(meal.id)
    setError('')
    setSuccess('')

    try {
      await deleteMealEntry(meal.id)
      await loadSummary()
      setSuccess(`${meal.food_name} removed from your meal history.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete meal.')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleSaveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const calorieValue = manualCalories.trim()
      ? Number(manualCalories)
      : null

    const proteinValue = manualProtein.trim()
      ? Number(manualProtein)
      : null

    if (
      calorieValue !== null &&
      (!Number.isInteger(calorieValue) || calorieValue < 800 || calorieValue > 10000)
    ) {
      setError('Manual calories must be between 800 and 10000.')
      return
    }

    if (
      proteinValue !== null &&
      (!Number.isInteger(proteinValue) || proteinValue < 0 || proteinValue > 500)
    ) {
      setError('Manual protein must be between 0g and 500g.')
      return
    }

    setSettingsSaving(true)
    setError('')
    setSuccess('')

    const data: NutritionSettingsData = {
      biological_sex: biologicalSex,
      activity_level: activityLevel,
      manual_calorie_target: calorieValue,
      manual_protein_target_g: proteinValue,
    }

    try {
      if (targets) {
        await updateNutritionSettings(data)
      } else {
        await createNutritionSettings(data)
      }

      await loadTargets()
      setSettingsOpen(false)
      setSuccess('Nutrition settings saved successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save settings.')
    } finally {
      setSettingsSaving(false)
    }
  }

  async function handleAddWater(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const amount = Number(waterAmount)

    if (!Number.isInteger(amount) || amount < 1 || amount > 5000) {
      setError('Enter water amount between 1ml and 5000ml.')
      return
    }

    setWaterSaving(true)
    setError('')
    setSuccess('')

    try {
      await createWaterIntake({
        intake_date: selectedDate,
        amount_ml: amount,
      })

      await loadWellness()
      setWaterAmount('250')
      setSuccess(`${amount}ml water intake recorded.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save water intake.')
    } finally {
      setWaterSaving(false)
    }
  }

  async function handleDeleteWater(log: WaterIntake) {
    setDeletingWaterId(log.id)
    setError('')

    try {
      await deleteWaterIntake(log.id)
      await loadWellness()
      setSuccess('Water entry deleted.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete water entry.')
    } finally {
      setDeletingWaterId(null)
    }
  }

  async function handleAddSleep(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const hours = Number(sleepHours)
    const minutes = Number(sleepMinutes)
    const duration = hours * 60 + minutes

    if (
      !Number.isInteger(hours) ||
      !Number.isInteger(minutes) ||
      hours < 0 ||
      hours > 24 ||
      minutes < 0 ||
      minutes > 59 ||
      duration < 1 ||
      duration > 1440
    ) {
      setError('Enter a valid sleep duration.')
      return
    }

    setSleepSaving(true)
    setError('')
    setSuccess('')

    try {
      await createSleepLog({
        sleep_date: selectedDate,
        duration_minutes: duration,
        quality: sleepQuality,
        notes: sleepNotes,
      })

      await loadWellness()
      setSleepHours('8')
      setSleepMinutes('0')
      setSleepNotes('')
      setSuccess('Sleep record saved successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save sleep record.')
    } finally {
      setSleepSaving(false)
    }
  }

  async function handleDeleteSleep(log: SleepLog) {
    setDeletingSleepId(log.id)
    setError('')

    try {
      await deleteSleepLog(log.id)
      await loadWellness()
      setSuccess('Sleep record deleted.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete sleep record.')
    } finally {
      setDeletingSleepId(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7 pb-10 text-white">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-orange-400">
            <Leaf size={16} />
            <span>Nutrition & Wellness</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Nutrition Coach
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Track food, hydration, sleep and daily nutrition goals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <CalendarDays size={18} className="text-orange-400" />
            <input
              type="date"
              value={selectedDate}
              max={getLocalDate()}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="min-w-0 bg-transparent text-sm text-white outline-none [color-scheme:dark]"
            />
          </div>

          <button
            type="button"
            onClick={() => setSettingsOpen((value) => !value)}
            className="flex items-center gap-2 rounded-xl border border-orange-400/20 bg-orange-400/10 px-4 py-3 text-sm font-medium text-orange-300 transition hover:bg-orange-400/20"
          >
            <Settings2 size={17} />
            Settings
          </button>
        </div>
      </div>

      {/* Feedback */}
      {error && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          <span>{error}</span>
          <button onClick={() => setError('')} aria-label="Dismiss error">
            <X size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={17} />
            {success}
          </span>
          <button onClick={() => setSuccess('')} aria-label="Dismiss message">
            <X size={18} />
          </button>
        </div>
      )}

      {summaryError && (
        <ErrorState
          title="Nutrition summary unavailable"
          message={summaryError}
          onRetry={() => setSummaryRetry((value) => value + 1)}
        />
      )}

      {/* Nutrition Settings */}
      {settingsOpen && (
        <section className="rounded-2xl border border-orange-400/20 bg-white/[0.03] p-5 sm:p-6">
          <SectionHeading
            title="Personal Nutrition Settings"
            description="Choose your details to calculate estimated daily targets."
            icon={Settings2}
          />

          <form onSubmit={handleSaveSettings} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">
                Biological sex
              </label>
              <select
                value={biologicalSex}
                onChange={(event) =>
                  setBiologicalSex(event.target.value as BiologicalSex)
                }
                className="w-full rounded-xl border border-white/10 bg-[#151923] px-4 py-3 text-sm text-white outline-none focus:border-orange-400/50"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">
                Activity level
              </label>
              <select
                value={activityLevel}
                onChange={(event) =>
                  setActivityLevel(event.target.value as ActivityLevel)
                }
                className="w-full rounded-xl border border-white/10 bg-[#151923] px-4 py-3 text-sm text-white outline-none focus:border-orange-400/50"
              >
                {activityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">
                Manual calorie target (optional)
              </label>
              <input
                type="number"
                min="800"
                max="10000"
                value={manualCalories}
                onChange={(event) => setManualCalories(event.target.value)}
                placeholder="Use calculated target"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-orange-400/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">
                Manual protein target (optional)
              </label>
              <input
                type="number"
                min="0"
                max="500"
                value={manualProtein}
                onChange={(event) => setManualProtein(event.target.value)}
                placeholder="Use calculated target"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-orange-400/50"
              />
            </div>

            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <button
                type="submit"
                disabled={settingsSaving}
                className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
              >
                {settingsSaving ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={17} />
                )}
                Save Settings
              </button>

              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm text-slate-300 hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </form>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            Estimates use your fitness profile and selected activity level.
            Manual targets override calculated values. These estimates are not
            medical advice.
          </p>
        </section>
      )}

      {/* Daily target overview */}
      {targetsError && (
        <ErrorState
          title="Nutrition targets unavailable"
          message={targetsError}
          onRetry={() => {
            setTargetsLoading(true)
            setTargetsError('')
            setTargetsRetry((value) => value + 1)
          }}
        />
      )}
      <section className="rounded-3xl border border-orange-400/20 bg-gradient-to-br from-orange-500/15 via-white/[0.03] to-transparent p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-orange-300">
              Daily Nutrition Overview
            </p>

            {targetsLoading ? (
              <p className="mt-3 text-lg text-slate-300">Loading targets...</p>
            ) : targets ? (
              <>
                <h2 className="mt-2 text-3xl font-bold">
                  {numberValue(totals?.calories).toFixed(0)}
                  <span className="ml-2 text-base font-medium text-slate-400">
                    / {targets.calories} kcal
                  </span>
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Calories recorded for {formatDate(selectedDate)}
                </p>
              </>
            ) : (
              <>
                <h2 className="mt-2 text-2xl font-bold">
                  Set up your nutrition targets
                </h2>
                <p className="mt-2 max-w-xl text-sm text-slate-400">
                  Complete your fitness profile with date of birth, height and
                  weight, then configure your nutrition settings.
                </p>
              </>
            )}
          </div>

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-400/10 text-orange-400">
            <Flame size={34} />
          </div>
        </div>

        {targets && (
          <>
            <div className="mt-7 h-3 overflow-hidden rounded-full bg-black/20">
              <div
                className="h-full rounded-full bg-orange-400 transition-all"
                style={{
                  width: `${percentage(
                    numberValue(totals?.calories),
                    targets.calories,
                  )}%`,
                }}
              />
            </div>

            <div className="mt-2 flex justify-between text-xs text-slate-400">
              <span>
                {percentage(
                  numberValue(totals?.calories),
                  targets.calories,
                ).toFixed(0)}% of target
              </span>
              <span>
                {Math.max(
                  0,
                  targets.calories - numberValue(totals?.calories),
                ).toFixed(0)} kcal remaining
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                <p className="text-xs text-slate-400">BMR estimate</p>
                <p className="mt-1 text-xl font-bold">{targets.bmr}</p>
                <p className="text-xs text-slate-500">kcal/day</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                <p className="text-xs text-slate-400">TDEE estimate</p>
                <p className="mt-1 text-xl font-bold">{targets.tdee}</p>
                <p className="text-xs text-slate-500">kcal/day</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                <p className="text-xs text-slate-400">Water target</p>
                <p className="mt-1 text-xl font-bold">
                  {(targets.water_ml / 1000).toFixed(1)}L
                </p>
                <p className="text-xs text-slate-500">estimated</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                <p className="text-xs text-slate-400">Age</p>
                <p className="mt-1 text-xl font-bold">{targets.age}</p>
                <p className="text-xs text-slate-500">years</p>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Macro cards */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Your Nutrition Breakdown</h2>
          <p className="mt-1 text-sm text-slate-400">
            Daily intake compared with your estimated targets.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <NutritionCard
            title="Calories"
            value={numberValue(totals?.calories)}
            target={targets?.calories}
            unit="kcal"
            icon={Flame}
            description="Energy"
          />
          <NutritionCard
            title="Protein"
            value={numberValue(totals?.protein_g)}
            target={targets?.protein_g}
            unit="g"
            icon={Beef}
            description="Muscle support"
          />
          <NutritionCard
            title="Carbohydrates"
            value={numberValue(totals?.carbohydrates_g)}
            target={targets?.carbohydrates_g}
            unit="g"
            icon={Wheat}
            description="Energy source"
          />
          <NutritionCard
            title="Fat"
            value={numberValue(totals?.fat_g)}
            target={targets?.fat_g}
            unit="g"
            icon={Droplets}
            description="Dietary fat"
          />
        </div>
      </section>

      {/* Water and sleep trackers */}
      {wellnessError && (
        <ErrorState
          title="Water and sleep records unavailable"
          message={wellnessError}
          onRetry={() => {
            setWellnessError('')
            setWellnessRetry((value) => value + 1)
          }}
        />
      )}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Water tracker */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <SectionHeading
            title="Water Tracker"
            description="Record your daily water intake."
            icon={GlassWater}
          />

          <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm text-slate-400">Total consumed</p>
                <p className="mt-1 text-3xl font-bold text-white">
                  {(waterTotal / 1000).toFixed(2)}
                  <span className="ml-1 text-sm text-slate-400">L</span>
                </p>
              </div>
              <Droplets size={32} className="text-cyan-400" />
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-cyan-400 transition-all"
                style={{
                  width: `${percentage(waterTotal, waterTarget)}%`,
                }}
              />
            </div>

            <p className="mt-2 text-xs text-slate-400">
              {waterTarget
                ? `${waterTotal} / ${waterTarget} ml estimated target`
                : 'Configure nutrition settings to see your estimated target.'}
            </p>
          </div>

          <form onSubmit={handleAddWater} className="mt-4 flex gap-2">
            <input
              type="number"
              min="1"
              max="5000"
              value={waterAmount}
              onChange={(event) => setWaterAmount(event.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
              placeholder="Amount in ml"
              required
            />

            <button
              type="submit"
              disabled={waterSaving}
              className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-600 disabled:opacity-50"
            >
              {waterSaving ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Plus size={17} />
              )}
              Add
            </button>
          </form>

          <div className="mt-4 space-y-2">
            {waterLogs.length === 0 ? (
              <p className="py-5 text-center text-sm text-slate-500">
                No water entries recorded for this date.
              </p>
            ) : (
              waterLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-black/10 p-3"
                >
                  <div className="flex items-center gap-3">
                    <Droplets size={17} className="text-cyan-400" />
                    <span className="text-sm text-white">
                      {log.amount_ml} ml
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(log.created_at).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleDeleteWater(log)}
                    disabled={deletingWaterId === log.id}
                    className="rounded-lg p-2 text-red-400 hover:bg-red-400/10 disabled:opacity-50"
                    aria-label="Delete water entry"
                  >
                    {deletingWaterId === log.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sleep tracker */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <SectionHeading
            title="Sleep Tracker"
            description="Record sleep duration and quality."
            icon={Moon}
          />

          <div className="rounded-xl border border-indigo-400/10 bg-indigo-400/5 p-4">
            <p className="text-sm text-slate-400">Total sleep recorded</p>
            <p className="mt-1 text-3xl font-bold text-white">
              {sleepTotalHours.toFixed(1)}
              <span className="ml-1 text-sm text-slate-400">hours</span>
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {sleepLogs.length} sleep record(s) for {formatDate(selectedDate)}
            </p>
          </div>

          <form onSubmit={handleAddSleep} className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-xs text-slate-400">
                  Hours
                </label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={sleepHours}
                  onChange={(event) => setSleepHours(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-indigo-400/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs text-slate-400">
                  Minutes
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={sleepMinutes}
                  onChange={(event) => setSleepMinutes(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-indigo-400/50"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs text-slate-400">
                Sleep quality
              </label>
              <select
                value={sleepQuality}
                onChange={(event) =>
                  setSleepQuality(event.target.value as SleepQuality)
                }
                className="w-full rounded-xl border border-white/10 bg-[#151923] px-4 py-3 text-sm text-white outline-none focus:border-indigo-400/50"
              >
                <option value="poor">Poor</option>
                <option value="okay">Okay</option>
                <option value="good">Good</option>
              </select>
            </div>

            <input
              type="text"
              maxLength={250}
              value={sleepNotes}
              onChange={(event) => setSleepNotes(event.target.value)}
              placeholder="Sleep notes (optional)"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-400/50"
            />

            <button
              type="submit"
              disabled={sleepSaving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-50"
            >
              {sleepSaving ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Clock3 size={17} />
              )}
              Save Sleep Record
            </button>
          </form>

          <div className="mt-4 space-y-2">
            {sleepLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-black/10 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    {(log.duration_minutes / 60).toFixed(1)} hours
                    <span className="ml-2 text-xs capitalize text-indigo-300">
                      {log.quality}
                    </span>
                  </p>
                  {log.notes && (
                    <p className="mt-1 text-xs text-slate-500">{log.notes}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => void handleDeleteSleep(log)}
                  disabled={deletingSleepId === log.id}
                  className="rounded-lg p-2 text-red-400 hover:bg-red-400/10 disabled:opacity-50"
                  aria-label="Delete sleep record"
                >
                  {deletingSleepId === log.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Food library and Add Meal */}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section id="food-library" className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Food Library</h2>
              <p className="mt-1 text-xs text-slate-400">
                Search and select what you ate.
              </p>
            </div>
            <Apple className="text-orange-400" size={24} />
          </div>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search rice, eggs, paneer..."
              className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-orange-400/50"
            />
          </div>

          <div className="relative mt-3">
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as FoodCategory | '')
              }
              className="w-full appearance-none rounded-xl border border-white/10 bg-[#151923] px-4 py-3 text-sm text-slate-200 outline-none focus:border-orange-400/50"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={17}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          <div className="mt-4 space-y-2">
            {foodsLoading ? (
              <LoadingState title="Loading food library..." />
            ) : foodsError ? (
              <ErrorState
                title="Food library unavailable"
                message={foodsError}
                onRetry={() => setFoodsRetry((value) => value + 1)}
              />
            ) : foods.length === 0 ? (
              <EmptyState
                title="No food items found"
                description="Try another search term or choose a different category."
                actionLabel="Clear filters"
                onAction={() => {
                  setSearch('')
                  setCategory('')
                }}
              />
            ) : (
              foods.map((food) => {
                const isSelected = selectedFood?.id === food.id

                return (
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => setSelectedFood(food)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition ${
                      isSelected
                        ? 'border-orange-400/50 bg-orange-400/10'
                        : 'border-white/5 bg-black/10 hover:border-white/20'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium text-white">
                          {food.name}
                        </span>
                        {food.is_vegetarian && (
                          <span className="rounded-md bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-300">
                            Veg
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-slate-400">
                        {numberValue(food.calories).toFixed(0)} kcal ·{' '}
                        {numberValue(food.protein_g).toFixed(1)}g protein per{' '}
                        {numberValue(food.serving_size_g)}g
                      </p>
                    </div>

                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isSelected
                          ? 'bg-orange-400 text-black'
                          : 'bg-white/5 text-slate-400'
                      }`}
                    >
                      {isSelected ? (
                        <CheckCircle2 size={17} />
                      ) : (
                        <Plus size={17} />
                      )}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </section>

        {/* Add meal */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Add Meal</h2>
            <p className="mt-1 text-xs text-slate-400">
              Record your food intake.
            </p>
          </div>

          <form onSubmit={handleAddMeal} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">
                Selected Food
              </label>

              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                {selectedFood ? (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {selectedFood.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {numberValue(selectedFood.calories)} kcal per{' '}
                        {numberValue(selectedFood.serving_size_g)}g
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedFood(null)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                      aria-label="Remove selected food"
                    >
                      <X size={17} />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    Select a food from the library.
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">
                Meal Type
              </label>

              <div className="grid grid-cols-2 gap-2">
                {mealOptions.map((meal) => {
                  const Icon = mealIcons[meal.value]

                  return (
                    <button
                      key={meal.value}
                      type="button"
                      onClick={() => setMealType(meal.value)}
                      className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-medium transition ${
                        mealType === meal.value
                          ? 'border-orange-400/50 bg-orange-400/10 text-orange-300'
                          : 'border-white/10 bg-black/10 text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      <Icon size={15} />
                      {meal.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="meal-quantity"
                className="mb-2 block text-xs font-medium text-slate-400"
              >
                Quantity (grams)
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((value) =>
                      String(Math.max(1, Number(value || 1) - 10)),
                    )
                  }
                  className="rounded-xl border border-white/10 p-3 text-slate-300 hover:bg-white/5"
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>

                <input
                  id="meal-quantity"
                  type="number"
                  min="1"
                  max="10000"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-center text-sm text-white outline-none focus:border-orange-400/50"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((value) =>
                      String(Math.min(10000, Number(value || 0) + 10)),
                    )
                  }
                  className="rounded-xl border border-white/10 p-3 text-slate-300 hover:bg-white/5"
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="meal-notes"
                className="mb-2 block text-xs font-medium text-slate-400"
              >
                Notes (optional)
              </label>
              <input
                id="meal-notes"
                type="text"
                maxLength={250}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="e.g. Homemade, less oil..."
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-orange-400/50"
              />
            </div>

            {previewNutrition && (
              <div className="rounded-xl border border-orange-400/20 bg-orange-400/5 p-4">
                <p className="mb-3 text-xs font-semibold text-orange-300">
                  Estimated Nutrition
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-slate-500">Calories</p>
                    <p className="mt-1 font-semibold text-white">
                      {previewNutrition.calories.toFixed(1)} kcal
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Protein</p>
                    <p className="mt-1 font-semibold text-white">
                      {previewNutrition.protein.toFixed(1)}g
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Carbs</p>
                    <p className="mt-1 font-semibold text-white">
                      {previewNutrition.carbs.toFixed(1)}g
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Fat</p>
                    <p className="mt-1 font-semibold text-white">
                      {previewNutrition.fat.toFixed(1)}g
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedFood || saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <CirclePlus size={17} />
              )}
              {saving ? 'Saving Meal...' : 'Add to Food Diary'}
            </button>
          </form>
        </section>
      </div>

      {/* Meal diary */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Food Diary</h2>
            <p className="mt-1 text-xs text-slate-400">
              {summary?.total_entries ?? 0} meals recorded on{' '}
              {formatDate(selectedDate)}
            </p>
          </div>

          <Utensils size={23} className="text-orange-400" />
        </div>

        {loading ? (
          <LoadingState title="Loading food diary..." />
        ) : summaryError ? (
          <ErrorState
            title="Food diary unavailable"
            message={summaryError}
            onRetry={() => setSummaryRetry((value) => value + 1)}
          />
        ) : summary?.total_entries === 0 ? (
          <EmptyState
            title="No meals recorded yet"
            description="Add your first meal using the food library above."
            actionLabel="Browse food library"
            onAction={() => document.getElementById('food-library')?.scrollIntoView({ behavior: 'smooth' })}
          />
        ) : (
          <div className="space-y-5">
            {mealOptions.map((meal) => {
              const entries = mealsByType[meal.value]
              const Icon = mealIcons[meal.value]

              if (entries.length === 0) return null

              return (
                <div key={meal.value}>
                  <div className="mb-3 flex items-center gap-2">
                    <Icon size={17} className="text-orange-400" />
                    <h3 className="text-sm font-semibold">{meal.label}</h3>
                    <span className="text-xs text-slate-500">
                      ({entries.length})
                    </span>
                  </div>

                  <div className="space-y-2">
                    {entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex flex-col justify-between gap-3 rounded-xl border border-white/5 bg-black/10 p-4 sm:flex-row sm:items-center"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white">
                            {entry.food_name}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {numberValue(entry.quantity_g)}g ·{' '}
                            {entry.food_nutrition.calories.toFixed(1)} kcal
                          </p>
                          {entry.notes && (
                            <p className="mt-1 text-xs text-slate-500">
                              {entry.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-4 sm:justify-end">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-white">
                              {entry.food_nutrition.protein_g.toFixed(1)}g
                            </p>
                            <p className="text-[10px] text-slate-500">
                              Protein
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => void handleDeleteMeal(entry)}
                            disabled={deletingId === entry.id}
                            className="rounded-lg border border-red-400/10 p-2 text-red-400 transition hover:bg-red-400/10 disabled:opacity-50"
                            aria-label={`Delete ${entry.food_name}`}
                          >
                            {deletingId === entry.id ? (
                              <Loader2 size={17} className="animate-spin" />
                            ) : (
                              <Trash2 size={17} />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <p className="text-center text-xs leading-5 text-slate-500">
        Nutrition values are estimates based on the food database. Calorie,
        macro and water targets are estimates, not medical advice. Actual
        requirements vary with individual needs, ingredients and activity.
      </p>
    </div>
  )
}
