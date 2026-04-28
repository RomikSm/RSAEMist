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
  /** Single asset scope ("All Cars" typeahead). `null` = all assets. */
  assetId: string | null
  /** Multi-select location scope. Empty array = all locations. */
  location: string[]
  /** Alert severity gate (single-value enum). */
  severity: SeverityFilter
  /**
   * Trailing time window in days.
   *  - positive number — last N days (today, 3, 7, 30…);
   *  - `-1`            — custom range, see `customFrom` / `customTo`;
   *  - `null`          — all time.
   */
  rangeDays: number | null
  /** ISO date `YYYY-MM-DD` (inclusive start), used only when `rangeDays === -1`. */
  customFrom: string | null
  /** ISO date `YYYY-MM-DD` (inclusive end), used only when `rangeDays === -1`. */
  customTo: string | null

  // Refinements from the left sidebar.
  /** Multi-select car types. Empty array = any type. */
  carType: string[]
  /** Multi-select alert types (load / door / impact / handbrake). */
  alertType: string[]
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
  location: [],
  severity: 'all',
  rangeDays: 30,
  customFrom: null,
  customTo: null,
  carType: [],
  alertType: [],
}

/**
 * Migrate a previously-saved view (which may have stored `carType` /
 * `alertType` / `location` as `string | null`) to the current shape
 * where these fields are `string[]`.
 */
function normalizeState(raw: unknown): FiltersState {
  const s = (raw ?? {}) as Partial<FiltersState> & Record<string, unknown>
  const arr = (v: unknown): string[] => {
    if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string')
    if (typeof v === 'string') return [v]
    return []
  }
  return {
    assetId: typeof s.assetId === 'string' ? s.assetId : null,
    location: arr(s.location),
    severity: (s.severity === 'alerts' || s.severity === 'priority' || s.severity === 'all') ? s.severity : 'all',
    rangeDays: typeof s.rangeDays === 'number' ? s.rangeDays : null,
    customFrom: typeof s.customFrom === 'string' ? s.customFrom : null,
    customTo: typeof s.customTo === 'string' ? s.customTo : null,
    carType: arr(s.carType),
    alertType: arr(s.alertType),
  }
}

const STORAGE_KEY = 'rsaemist.savedViews.v1'

function loadSavedViews(): SavedView[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (v): v is SavedView =>
          typeof v === 'object' &&
          v !== null &&
          typeof (v as SavedView).id === 'string' &&
          typeof (v as SavedView).name === 'string' &&
          typeof (v as SavedView).state === 'object',
      )
      .map(v => ({ ...v, state: normalizeState(v.state) }))
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
      if (v) setFilters(normalizeState(v.state))
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
 * Translate UI filter state into a `MessageFilter` accepted by the backend.
 *
 * The backend `/api/v1/messages` accepts repeated query params for
 * multi-value filters (`asset_id`, `alert_type`, `car_type`,
 * `location`), so we forward arrays as-is — `client.ts::buildUrl`
 * serialises them as `?k=a&k=b`. Single-value selections are sent as
 * a single string for shorter, cleaner URLs.
 */
export function buildMessageFilter(state: FiltersState, extra: MessageFilter = {}): MessageFilter {
  const out: MessageFilter = { ...extra }
  if (state.assetId) out.assetId = state.assetId
  if (state.location.length === 1) out.location = state.location[0]
  else if (state.location.length > 1) out.location = state.location
  if (state.carType.length === 1) out.carType = state.carType[0]
  else if (state.carType.length > 1) out.carType = state.carType
  if (state.alertType.length === 1) out.alertType = state.alertType[0]
  else if (state.alertType.length > 1) out.alertType = state.alertType

  if (state.severity === 'priority') out.isPriorityAlert = true
  else if (state.severity === 'alerts') out.isAlert = true
  // 'all' → do not constrain.

  if (state.rangeDays === -1) {
    // Custom range: send `from` / `to` as local-date boundaries.
    if (state.customFrom) out.from = `${state.customFrom}T00:00:00`
    if (state.customTo) out.to = `${state.customTo}T23:59:59`
  } else if (state.rangeDays !== null && state.rangeDays > 0) {
    const from = new Date()
    from.setDate(from.getDate() - state.rangeDays)
    out.from = from.toISOString().replace(/\.\d+Z$/, '')
  }
  return out
}


/** True when `state` differs from the default ("nothing configured"). */
export function isFiltersActive(state: FiltersState): boolean {
  return (
    state.assetId !== null ||
    state.location.length > 0 ||
    state.severity !== 'all' ||
    state.rangeDays !== DEFAULT_STATE.rangeDays ||
    state.customFrom !== null ||
    state.customTo !== null ||
    state.carType.length > 0 ||
    state.alertType.length > 0
  )
}

export const FILTERS_DEFAULT_STATE = DEFAULT_STATE
