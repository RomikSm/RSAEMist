/**
 * Small async-data hook used by every feature component.
 *
 * It deliberately avoids a dependency on React Query / SWR: the app is
 * small enough that a single `useEffect + AbortController` pattern with
 * typed `{ data, error, isLoading, reload }` is the best practice.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../api'

export interface UseApiState<T> {
  data: T | null
  error: ApiError | Error | null
  isLoading: boolean
  /** Manually re-run the fetcher (e.g. after mutating data). */
  reload: () => void
}

/**
 * @param fetcher  Function that performs the request; must accept an `AbortSignal`.
 * @param deps     Dependency list; the request is re-issued when any value changes.
 * @param enabled  When `false`, the fetcher is not run (useful for gating on auth).
 */
export function useApi<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: ReadonlyArray<unknown>,
  enabled: boolean = true,
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<ApiError | Error | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(enabled)
  const [reloadTick, setReloadTick] = useState(0)

  // Keep the latest fetcher in a ref so we don't re-run on every render.
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return
    }
    const controller = new AbortController()
    setIsLoading(true)
    setError(null)
    fetcherRef.current(controller.signal)
      .then(result => {
        if (controller.signal.aborted) return
        setData(result)
        setIsLoading(false)
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err : new Error(String(err)))
        setIsLoading(false)
      })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, reloadTick, ...deps])

  const reload = useCallback(() => setReloadTick(t => t + 1), [])

  return { data, error, isLoading, reload }
}
