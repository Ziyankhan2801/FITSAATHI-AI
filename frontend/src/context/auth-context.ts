import { createContext } from 'react'
import type { AuthUser } from '../services/api'

export interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
)