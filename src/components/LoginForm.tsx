/** Minimal login screen shown when no session cookie is present. */
import { useState, type FormEvent } from 'react'
import { useAuth } from '../AuthContext'
import { ApiError } from '../api'
import './LoginForm.css'

export default function LoginForm() {
  const { login } = useAuth()
  const [loginValue, setLoginValue] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await login({ login: loginValue.trim(), password })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.status === 401 ? 'Invalid credentials.' : err.message)
      } else {
        setError('Unable to sign in. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit} noValidate>
        <div className="login-brand">
          <span className="login-brand-main">RSAEmist<sup>®</sup></span>
          <span className="login-brand-sub">ALERT REVIEW</span>
        </div>
        <label className="login-field">
          <span>Login</span>
          <input
            type="text"
            autoComplete="username"
            value={loginValue}
            onChange={e => setLoginValue(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </label>
        <label className="login-field">
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </label>
        {error && <div className="login-error" role="alert">{error}</div>}
        <button type="submit" className="login-submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
