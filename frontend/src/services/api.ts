
const API_BASE_URL = 'http://localhost:8000/api'

export interface HealthCheckResponse {
  status: string
  message: string
  service: string
}

export interface AuthUser {
  id: number
  username: string
  email: string
}

interface AuthResponse {
  status: string
  message: string
  user: AuthUser
}

interface CsrfResponse {
  csrfToken: string
}

export interface FitnessProfile {
  id: number
  date_of_birth: string | null
  age: number | null
  height_cm: number | null
  weight_kg: number | null
  fitness_goal: string
  experience_level: string
  workout_days_per_week: number | null
  workout_minutes: number | null
  equipment_level: string
  dietary_preference: string
  sleep_hours: number | null
  has_health_limitation: boolean | null
  safety_notes: string
  created_at: string
  updated_at: string
}

export type FitnessProfileUpdate = Omit<
  FitnessProfile,
  'id' | 'age' | 'created_at' | 'updated_at'
>

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json()

    if (typeof data === 'object' && data !== null) {
      const messages = Object.values(data).flatMap((value) =>
        Array.isArray(value) ? value.map(String) : [String(value)],
      )

      if (messages.length > 0) {
        return messages.join(' ')
      }
    }
  } catch {
    // Use the HTTP status if the response isn't JSON.
  }

  return `Request failed: ${response.status}`
}

async function getCsrfToken(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/csrf/`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  const data = (await response.json()) as CsrfResponse
  return data.csrfToken
}

async function csrfRequest<T>(
  endpoint: string,
  method: 'POST' | 'PATCH',
  body?: unknown,
): Promise<T> {
  const csrfToken = await getCsrfToken()

  const response = await fetch(`${API_BASE_URL}/${endpoint}/`, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return (await response.json()) as T
}

export async function checkBackendHealth(): Promise<HealthCheckResponse> {
  const response = await fetch(`${API_BASE_URL}/health/`)

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status}`)
  }

  return (await response.json()) as HealthCheckResponse
}

export async function registerUser(data: {
  username: string
  email: string
  password: string
  password_confirm: string
}): Promise<AuthResponse> {
  return csrfRequest<AuthResponse>('register', 'POST', data)
}

export async function loginUser(data: {
  username: string
  password: string
}): Promise<AuthResponse> {
  return csrfRequest<AuthResponse>('login', 'POST', data)
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/me/`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return (await response.json()) as AuthUser
}

export async function logoutUser(): Promise<{
  status: string
  message: string
}> {
  return csrfRequest<{ status: string; message: string }>('logout', 'POST')
}

export async function getFitnessProfile(): Promise<FitnessProfile> {
  const response = await fetch(`${API_BASE_URL}/fitness-profile/`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return (await response.json()) as FitnessProfile
}

export async function updateFitnessProfile(
  data: FitnessProfileUpdate,
): Promise<FitnessProfile> {
  return csrfRequest<FitnessProfile>('fitness-profile', 'PATCH', data)
}



export interface WorkoutSession {
  id: number
  workout_day: number
  workout_title: string
  completed_exercises: string[]
  total_exercises: number
  completion_percentage: number
  started_at: string
  updated_at: string
  completed_at: string | null
  workout_date: string | null
}

export interface WorkoutSessionData {
  workout_day: number
  workout_title: string
  completed_exercises: string[]
  total_exercises: number
  completion_percentage: number
  completed_at?: string | null
}

export async function getWorkoutSessions(): Promise<WorkoutSession[]> {
  const response = await fetch(`${API_BASE_URL}/workouts/`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return (await response.json()) as WorkoutSession[]
}

export async function createWorkoutSession(
  data: WorkoutSessionData,
): Promise<WorkoutSession> {
  return csrfRequest<WorkoutSession>('workouts', 'POST', data)
}

export async function updateWorkoutSession(
  id: number,
  data: Partial<WorkoutSessionData>,
): Promise<WorkoutSession> {
  const csrfToken = await getCsrfToken()

  const response = await fetch(`${API_BASE_URL}/workouts/${id}/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return (await response.json()) as WorkoutSession
}



export interface WorkoutHistory {
  id: number
  workout_day: number
  workout_title: string
  completed_exercises: string[]
  total_exercises: number
  completion_percentage: number
  workout_date: string
  completed_at: string
  created_at: string
}

export async function getWorkoutHistory(): Promise<WorkoutHistory[]> {
  const response = await fetch(`${API_BASE_URL}/workout-history/`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return (await response.json()) as WorkoutHistory[]
}




// ==========================================
// LEVEL 6: BODY MEASUREMENTS
// ==========================================

export interface BodyMeasurement {
  id: number
  measurement_date: string
  weight_kg: string | number
  waist_cm: string | number | null
  chest_cm: string | number | null
  hips_cm: string | number | null
  left_arm_cm: string | number | null
  right_arm_cm: string | number | null
  left_thigh_cm: string | number | null
  right_thigh_cm: string | number | null
  created_at: string
  updated_at: string
}

export type BodyMeasurementData = Omit<
  BodyMeasurement,
  'id' | 'created_at' | 'updated_at'
>

export async function getBodyMeasurements(): Promise<BodyMeasurement[]> {
  const response = await fetch(`${API_BASE_URL}/body-measurements/`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return (await response.json()) as BodyMeasurement[]
}

export async function createBodyMeasurement(
  data: BodyMeasurementData,
): Promise<BodyMeasurement> {
  return csrfRequest<BodyMeasurement>(
    'body-measurements',
    'POST',
    data,
  )
}

export async function updateBodyMeasurement(
  id: number,
  data: Partial<BodyMeasurementData>,
): Promise<BodyMeasurement> {
  return csrfRequest<BodyMeasurement>(
    `body-measurements/${id}`,
    'PATCH',
    data,
  )
}

export async function deleteBodyMeasurement(id: number): Promise<void> {
  const csrfToken = await getCsrfToken()

  const response = await fetch(`${API_BASE_URL}/body-measurements/${id}/`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'X-CSRFToken': csrfToken,
    },
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }
}


// ==========================================
// LEVEL 6: PRIVACY CONSENT
// ==========================================

export type ConsentType = 'photo_storage' | 'ai_analysis'

export interface PrivacyConsent {
  id: number
  consent_type: ConsentType
  is_granted: boolean
  granted_at: string | null
  withdrawn_at: string | null
  created_at: string
  updated_at: string
}

export async function getPrivacyConsents(): Promise<PrivacyConsent[]> {
  const response = await fetch(`${API_BASE_URL}/privacy-consents/`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return (await response.json()) as PrivacyConsent[]
}

export async function updatePrivacyConsent(
  consentType: ConsentType,
  isGranted: boolean,
): Promise<PrivacyConsent> {
  const consents = await getPrivacyConsents()

  const existing = consents.find(
    (consent) => consent.consent_type === consentType,
  )

  if (existing) {
    return csrfRequest<PrivacyConsent>(
      `privacy-consents/${existing.id}`,
      'PATCH',
      { is_granted: isGranted },
    )
  }

  return csrfRequest<PrivacyConsent>(
    'privacy-consents',
    'POST',
    {
      consent_type: consentType,
      is_granted: isGranted,
    },
  )
}


// ==========================================
// LEVEL 6: PROGRESS PHOTOS
// ==========================================

export type PhotoAngle = 'front' | 'side' | 'back'

export interface ProgressPhoto {
  id: number
  photo_angle: PhotoAngle
  uploaded_at: string
}

export async function getProgressPhotos(): Promise<ProgressPhoto[]> {
  const response = await fetch(`${API_BASE_URL}/progress-photos/`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return (await response.json()) as ProgressPhoto[]
}

export async function uploadProgressPhoto(
  image: File,
  photoAngle: PhotoAngle,
): Promise<ProgressPhoto> {
  const csrfToken = await getCsrfToken()
  const formData = new FormData()

  formData.append('image', image)
  formData.append('photo_angle', photoAngle)

  const response = await fetch(`${API_BASE_URL}/progress-photos/`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'X-CSRFToken': csrfToken,
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return (await response.json()) as ProgressPhoto
}

export async function deleteProgressPhoto(id: number): Promise<void> {
  const csrfToken = await getCsrfToken()

  const response = await fetch(`${API_BASE_URL}/progress-photos/${id}/`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'X-CSRFToken': csrfToken,
    },
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }
}

export function getProgressPhotoImageUrl(id: number): string {
  return `${API_BASE_URL}/progress-photos/${id}/image/`
}



// ==========================================
// LEVEL 7: EXERCISE LIBRARY
// ==========================================

export type ExerciseCategory =
  | 'strength'
  | 'cardio'
  | 'flexibility'
  | 'mobility'
  | 'balance'

export type ExerciseMuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'core'
  | 'legs'
  | 'full_body'

export type ExerciseDifficulty =
  | 'beginner'
  | 'intermediate'
  | 'advanced'

export type ExerciseEquipment =
  | 'none'
  | 'dumbbell'
  | 'resistance_band'
  | 'chair'
  | 'mat'
  | 'other'

export interface Exercise {
  id: number
  name: string
  slug: string
  description: string
  instructions: string[]
  category: ExerciseCategory
  muscle_group: ExerciseMuscleGroup
  difficulty: ExerciseDifficulty
  equipment: ExerciseEquipment
  sets: number
  reps: string
  rest_seconds: number
  image_url: string
  video_url: string
  safety_tips: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ExerciseFilters {
  search?: string
  category?: ExerciseCategory | ''
  muscle_group?: ExerciseMuscleGroup | ''
  difficulty?: ExerciseDifficulty | ''
  equipment?: ExerciseEquipment | ''
}

export async function getExercises(
  filters: ExerciseFilters = {},
): Promise<Exercise[]> {
  const params = new URLSearchParams()

  if (filters.search?.trim()) {
    params.set('search', filters.search.trim())
  }

  if (filters.category) {
    params.set('category', filters.category)
  }

  if (filters.muscle_group) {
    params.set('muscle_group', filters.muscle_group)
  }

  if (filters.difficulty) {
    params.set('difficulty', filters.difficulty)
  }

  if (filters.equipment) {
    params.set('equipment', filters.equipment)
  }

  const query = params.toString()
  const endpoint = `${API_BASE_URL}/exercises/${query ? `?${query}` : ''}`

  const response = await fetch(endpoint, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return (await response.json()) as Exercise[]
}

export async function getExercise(id: number): Promise<Exercise> {
  const response = await fetch(`${API_BASE_URL}/exercises/${id}/`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return (await response.json()) as Exercise
}

// ==========================================
// LEVEL 7: CUSTOM WORKOUT PLANS
// ==========================================

export interface WorkoutPlanExercise {
  id: number
  exercise: number
  exercise_name: string
  sets: number
  reps: string
  rest_seconds: number
  order: number
  created_at: string
}

export interface WorkoutPlan {
  id: number
  workout_day: number
  title: string
  focus: string
  planned_exercises: WorkoutPlanExercise[]
  created_at: string
  updated_at: string
}

export interface WorkoutPlanData {
  workout_day: number
  title: string
  focus?: string
}

export interface WorkoutPlanExerciseData {
  exercise: number
  sets: number
  reps: string
  rest_seconds: number
  order?: number
}

// Get all custom workout plans
export async function getWorkoutPlans(): Promise<WorkoutPlan[]> {
  const response = await fetch(`${API_BASE_URL}/workout-plans/`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return (await response.json()) as WorkoutPlan[]
}

// Create a workout plan
export async function createWorkoutPlan(
  data: WorkoutPlanData,
): Promise<WorkoutPlan> {
  return csrfRequest<WorkoutPlan>(
    'workout-plans',
    'POST',
    data,
  )
}

// Get a specific workout plan
export async function getWorkoutPlan(
  id: number,
): Promise<WorkoutPlan> {
  const response = await fetch(
    `${API_BASE_URL}/workout-plans/${id}/`,
    {
      method: 'GET',
      credentials: 'include',
    },
  )

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return (await response.json()) as WorkoutPlan
}

// Update workout plan title or focus
export async function updateWorkoutPlan(
  id: number,
  data: Partial<WorkoutPlanData>,
): Promise<WorkoutPlan> {
  return csrfRequest<WorkoutPlan>(
    `workout-plans/${id}`,
    'PATCH',
    data,
  )
}

// Add an exercise to a workout plan
export async function addExerciseToPlan(
  planId: number,
  data: WorkoutPlanExerciseData,
): Promise<WorkoutPlanExercise> {
  return csrfRequest<WorkoutPlanExercise>(
    `workout-plans/${planId}/exercises`,
    'POST',
    data,
  )
}

// Remove an exercise from a workout plan
export async function removeExerciseFromPlan(
  exercisePlanId: number,
): Promise<void> {
  const csrfToken = await getCsrfToken()

  const response = await fetch(
    `${API_BASE_URL}/workout-plan-exercises/${exercisePlanId}/`,
    {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'X-CSRFToken': csrfToken,
      },
    },
  )

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }
}