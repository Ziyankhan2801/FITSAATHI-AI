
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
