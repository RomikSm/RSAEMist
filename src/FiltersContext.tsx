/**
 * Dashboard-wide filter state.
 *
 * The top bar drives the *global scope* of what the dashboard is showing
 * (fleet / geography / severity / time window / saved views) and the left
 * sidebar further *refines* that scope for the priority-alerts list.
 *
 * Everything is translated to query params understood by the backend
 * (`/api/v1/messages` — see `api/messages.ts::toQuery`), so adding a new
 * filter is a matter of adding a field here and passing it through
 * `buildMessageFilter`.
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
import type { MessageFilter } from './api/types'

/**
 * Severity gate applied to the priority-alerts list:
 *  - `all`       — no flag filter (show every message);
 *  - `alerts`    — `is_alert=true`  (warning + critical);
 *  - `priority`  — `is_priority_alert=true` (critical only).
 */
export type SeverityFilter = 'all' | 'alerts' | 'priority'

export interface FiltersState {
  /** Single asset scope (top-bar "All Cars"). `null` = all assets. */
  assetId: string | null
  /** Single location scope (top-bar "All Locations"). `null` = all. */
  location: string | null
  /** Alert severity gate (top-bar "Severity"). */
  severity: SeverityFilter
  /** Trailing time window in days (top-bar "Last 7 Days"). `null` = all time. */
  rangeDays: number | null

  // Refinements from the left sidebar. They apply on top of the scope
  // above and never widen it.
  /** Car-type refinement from the left sidebar. `null` = any type. */
  carType: string | null
  /** Alert-type refinement (load / door / impact / handbrake). */
  alertType: string | null
}

/** Named preset saved under "Save View" in the top bar. */
export interface SavedView {
  id: string
  name: string
  state: FiltersState
}

export interface FiltersContextValue {
  filters: FiltersState
  setFilter: <K extends keyof FiltersState>(key: K, value: FiltersState[K]) => void
  /** Apply a bulk patch (used when loading a saved view). */
  patch: (partial: Partial<FiltersState>) => void
  /** Reset every field to its default ("All / All / All / All time"). */
  clear: () => void

  savedViews: SavedView[]
  saveView: (name: string) => SavedView
  applyView: (id: string) => void
  deleteView: (id: string) => void
}

const DEFAULT_STATE: FiltersState = {
  assetId: null,
  location: null,
  severity: 'all',
  rangeDays: null,
  carType: null,
  alertType: null,
}

const STORAGE_KEY = 'rsaemist.savedViews.v1'

function loadSavedViews(): SavedView[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (v): v is SavedView =>
        typeof v === 'object' &&
        v !== null &&
        typeof (v as SavedView).id === 'string' &&
        typeof (v as SavedView).name === 'string' &&
        typeof (v as SavedView).state === 'object',
    )
  } catch {
    return []
  }
}

const FiltersContext = createContext<FiltersContextValue | undefined>(undefined)

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_STATE)
  const [savedViews, setSavedViews] = useState<SavedView[]>(() => loadSavedViews())

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedViews))
    } catch {
      // Quota / private-mode — non-fatal; presets simply won't persist.
    }
  }, [savedViews])

  const setFilter = useCallback(
    <K extends keyof FiltersState>(key: K, value: FiltersState[K]) => {
      setFilters(prev => ({ ...prev, [key]: value }))
    },
    [],
  )

  const patch = useCallback((partial: Partial<FiltersState>) => {
    setFilters(prev => ({ ...prev, ...partial }))
  }, [])

  const clear = useCallback(() => setFilters(DEFAULT_STATE), [])

  const saveView = useCallback(
    (name: string) => {
      const view: SavedView = {
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        name: name.trim() || 'Untitled view',
        state: filters,
      }
      setSavedViews(prev => [...prev, view])
      return view
    },
    [filters],
  )

  const applyView = useCallback(
    (id: string) => {
      const v = savedViews.find(x => x.id === id)
      if (v) setFilters(v.state)
    },
    [savedViews],
  )

  const deleteView = useCallback((id: string) => {
    setSavedViews(prev => prev.filter(v => v.id !== id))
  }, [])

  const value = useMemo<FiltersContextValue>(
    () => ({ filters, setFilter, patch, clear, savedViews, saveView, applyView, deleteView }),
    [filters, setFilter, patch, clear, savedViews, saveView, applyView, deleteView],
  )

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>
}

export function useFilters(): FiltersContextValue {
  const ctx = useContext(FiltersContext)
  if (!ctx) throw new Error('useFilters must be used inside <FiltersProvider>')
  return ctx
}

/**
 * Translates the UI filter state into a `MessageFilter` accepted by the
 * backend. `rangeDays` is converted to an ISO `from` timestamp so that
 * Spring's `@DateTimeFormat(ISO.DATE_TIME)` binder accepts it.
 */
export function buildMessageFilter(state: FiltersState, extra: MessageFilter = {}): MessageFilter {
  const out: MessageFilter = { ...extra }
  if (state.assetId) out.assetId = state.assetId
  if (state.location) out.location = state.location
  if (state.carType) out.carType = state.carType
  if (state.alertType) out.alertType = state.alertType

  if (state.severity === 'priority') out.isPriorityAlert = true
  else if (state.severity === 'alerts') out.isAlert = true
  // 'all' → do not constrain.

  if (state.rangeDays !== null && state.rangeDays > 0) {
    const from = new Date()
    from.setDate(from.getDate() - state.rangeDays)
    // Backend expects ISO LocalDateTime (no timezone).
    out.from = from.toISOString().replace(/\.\d+Z$/, '')
  }
  return out
}

/** True when `state` differs from the default ("nothing configured"). */
export function isFiltersActive(state: FiltersState): boolean {
  return (
    state.assetId !== DEFAULT_STATE.assetId ||
    state.location !== DEFAULT_STATE.location ||
    state.severity !== DEFAULT_STATE.severity ||
    state.rangeDays !== DEFAULT_STATE.rangeDays ||
    state.carType !== DEFAULT_STATE.carType ||
    state.alertType !== DEFAULT_STATE.alertType
  )
}

export const FILTERS_DEFAULT_STATE = DEFAULT_STATE
