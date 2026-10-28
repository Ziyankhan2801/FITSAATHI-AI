
const API_BASE_URL = 'http://127.0.0.1:8000/api'

export interface HealthCheckResponse {
  status: string
  message: string
  service: string
}

export async function checkBackendHealth(): Promise<HealthCheckResponse> {
  const response = await fetch(`${API_BASE_URL}/health/`)

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status}`)
  }

  return response.json() as Promise<HealthCheckResponse>
}
