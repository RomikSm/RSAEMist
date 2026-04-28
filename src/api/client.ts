/**
 * Thin `fetch` wrapper used by every API module.
 *
 * Responsibilities:
 *  - Prepend the configured API base URL (default `/api/v1`, routed through
 *    the Vite dev proxy so HttpOnly cookies are same-origin).
 *  - Always send credentials so the backend-issued JWT cookies are
 *    attached to each request.
 *  - Parse JSON responses and throw a rich `ApiError` on non-2xx.
 *  - On a 401 response, attempt a single `/auth/refresh` round-trip and
 *    retry the original request. If refresh fails, the error bubbles up
 *    and the app can redirect to the login screen.
 *
 * Keep this module transport-only: it must not import domain code.
 */

import type { ApiErrorResponse } from './types'

// Hardcoded per product decision — no env files.
// Dev: use `/api/v1` so the Vite proxy forwards to the local backend and
// cookies stay same-origin. Prod (Vercel etc.): talk to the public backend
// directly over HTTPS.
const PROD_API_BASE_URL = 'https://sentinel.adammudrak.pp.ua/api/v1'
const DEV_API_BASE_URL = '/api/v1'
const API_BASE_URL = (import.meta.env.DEV ? DEV_API_BASE_URL : PROD_API_BASE_URL).replace(/\/+$/, '')

export class ApiError extends Error {
  readonly status: number
  readonly body: ApiErrorResponse | string | null

  constructor(status: number, message: string, body: ApiErrorResponse | string | null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** JSON body; will be serialised and `Content-Type` set. */
  json?: unknown
  /**
   * Query string parameters; `null`/`undefined`/`''` values are skipped.
   * Array values are serialized as repeated params (e.g. `?k=a&k=b`),
   * which is what the Spring backend expects for multi-value filters.
   */
  query?: Record<
    string,
    string | number | boolean | null | undefined | ReadonlyArray<string | number | boolean>
  >
  /** Abort signal for cancellation (used by React hooks on unmount). */
  signal?: AbortSignal
  /** Internal: set to true to skip the auto-refresh retry to avoid loops. */
  _retry?: boolean
  /** Internal: skip calling `/auth/refresh` on 401 (used by auth endpoints). */
  _skipAuthRefresh?: boolean
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
  if (!query) return url
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === '') continue
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === null || item === undefined || item === '') continue
        params.append(key, String(item))
      }
      continue
    }
    params.append(key, String(value))
  }
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

/**
 * Recursively converts object keys from snake_case to camelCase so that
 * the backend's Jackson `SNAKE_CASE` JSON can be consumed directly by
 * the TypeScript DTOs (which use camelCase, matching the Java records).
 *
 * Arrays are walked element-wise; primitives are returned as-is. We only
 * rename plain-object keys — Date/Map/Set-like values are not expected
 * in API responses, so a simple `Object.prototype.toString` check is
 * sufficient.
 */
function snakeToCamelKey(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_m, c: string) => c.toUpperCase())
}

function camelizeKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(camelizeKeys)
  }
  if (value !== null && typeof value === 'object' && (value as object).constructor === Object) {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[snakeToCamelKey(k)] = camelizeKeys(v)
    }
    return out
  }
  return value
}

async function parseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? ''
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null
  }
  if (contentType.includes('application/json')) {
    const json = await response.json()
    return camelizeKeys(json)
  }
  const text = await response.text()
  return text.length === 0 ? null : text
}

let refreshInFlight: Promise<void> | null = null

async function refreshTokens(): Promise<void> {
  // De-duplicate concurrent refresh attempts from parallel requests.
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const response = await fetch(buildUrl('/auth/refresh'), {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) {
        throw new ApiError(response.status, 'Session expired', await parseBody(response) as ApiErrorResponse | string | null)
      }
    })().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

export async function request<TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const { method = 'GET', json, query, signal, _retry, _skipAuthRefresh } = options

  const headers: Record<string, string> = { Accept: 'application/json' }
  let body: BodyInit | undefined
  if (json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(json)
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    credentials: 'include',
    headers,
    body,
    signal,
  })

  if (response.status === 401 && !_retry && !_skipAuthRefresh) {
    try {
      await refreshTokens()
    } catch (refreshError) {
      // Let the caller handle unauthenticated state (e.g. redirect to login).
      throw refreshError
    }
    return request<TResponse>(path, { ...options, _retry: true })
  }

  const parsed = await parseBody(response)
  if (!response.ok) {
    const message =
      parsed && typeof parsed === 'object' && 'message' in (parsed as Record<string, unknown>)
        ? String((parsed as ApiErrorResponse).message)
        : response.statusText || 'Request failed'
    throw new ApiError(response.status, message, parsed as ApiErrorResponse | string | null)
  }
  return parsed as TResponse
}
