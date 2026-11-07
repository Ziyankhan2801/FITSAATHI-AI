import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import { getCurrentUser } from '../services/api'
import { AuthContext } from './auth-context'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<import('../services/api').AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadInitialUser() {
      try {
        const currentUser = await getCurrentUser()

        if (active) {
          setUser(currentUser)
        }
      } catch {
        if (active) {
          setUser(null)
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialUser()

    return () => {
      active = false
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}