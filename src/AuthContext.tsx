/**
 * Authentication context.
 *
 * The backend issues JWTs as HttpOnly cookies, so the browser never sees
 * the tokens directly. We therefore treat the presence of a valid session
 * as the result of a `/auth/refresh` round-trip at startup:
 *   - 200 → we have a session; store the returned user in state.
 *   - 401 → show the login screen.
 *
 * `login` / `logout` mutate the state and re-render the app accordingly.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { auth, ApiError } from './api'
import type { AuthResponse, LoginRequest } from './api/types'

type AuthStatus = 'initialising' | 'authenticated' | 'anonymous'

interface AuthContextValue {
  status: AuthStatus
  user: AuthResponse | null
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('initialising')
  const [user, setUser] = useState<AuthResponse | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    auth
      .refresh(controller.signal)
      .then(response => {
        setUser(response)
        setStatus('authenticated')
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setUser(null)
        setStatus('anonymous')
      })
    return () => controller.abort()
  }, [])

  const loginFn = useCallback(async (credentials: LoginRequest) => {
    const response = await auth.login(credentials)
    setUser(response)
    setStatus('authenticated')
  }, [])

  const logoutFn = useCallback(async () => {
    try {
      await auth.logout()
    } catch (err) {
      // Even if the server call fails, we want to drop the local session.
      if (!(err instanceof ApiError)) throw err
    }
    setUser(null)
    setStatus('anonymous')
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login: loginFn, logout: logoutFn }),
    [status, user, loginFn, logoutFn],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
