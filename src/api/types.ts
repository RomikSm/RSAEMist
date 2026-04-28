/**
 * Typed DTOs mirroring the Spring Boot backend under `/api/v1`.
 *
 * These mirror the `org.example.sentinel.dto.*` records. Keep names in
 * sync with the backend — the API is JSON so properties use camelCase.
 */

export type AlertEvaluationMode = 'RAW' | 'THRESHOLD'

/* ---------- Auth ---------- */

export interface LoginRequest {
  login: string
  password: string
}

export interface AuthResponse {
  login: string
  carDirector: string | null
  message: string
}

/* ---------- Messages ---------- */

export interface MessageResponse {
  messageId: string
  assetId: string
  messageDate: string // ISO LocalDateTime, e.g. "2026-01-01T03:59:00"
  // Backend may return either the full evaluated shape (`raw*` /
  // `effective*` / `evaluationMode`) or, in the current default
  // serialization, just the flat `is_alert` / `is_priority_alert` flags
  // from the DB. We accept both — `classifySeverity` falls back from
  // `effective*` to `is*`.
  rawIsAlert?: boolean
  rawIsPriorityAlert?: boolean
  effectiveIsAlert?: boolean
  effectiveIsPriorityAlert?: boolean
  isAlert?: boolean
  isPriorityAlert?: boolean
  evaluationMode?: AlertEvaluationMode
  alertType: string | null
  alertValue: number | null
  owner: string | null
  carType: string | null
  carDirector: string | null
  location: string | null
  latitude: number | null
  longitude: number | null
  thresholdLabel: string | null
  thresholdMin: number | null
  thresholdMax: number | null
  measurementUnits: string | null
}

export interface MessageListResponse {
  items: MessageResponse[]
  limit: number
  offset: number
  total: number
}

export interface MessageFilter {
  /** Single value or list — backend accepts repeated query params. */
  assetId?: string | string[]
  isAlert?: boolean
  isPriorityAlert?: boolean
  mode?: AlertEvaluationMode
  alertType?: string | string[]
  carType?: string | string[]
  owner?: string | string[]
  carDirector?: string | string[]
  location?: string | string[]
  from?: string // ISO local date-time
  to?: string
  limit?: number
  offset?: number
}

/* ---------- Assets / Lookups ---------- */

export interface AssetSummaryResponse {
  assetId: string
  owner: string | null
  carType: string | null
  carDirector: string | null
  currentLocation: string | null
  latestShockEventAt: string | null
  latestShockDetail: string | null
}

export interface AssetListResponse {
  items: AssetSummaryResponse[]
}

/**
 * Compact asset row returned by `/api/v1/assets/search` — used by the
 * "All Cars" typeahead in the left filters pane. The endpoint only
 * returns rows when a non-blank query is provided, so the dropdown list
 * stays empty until the user types something (the fleet may have
 * thousands of cars and a full preload is intentionally not offered).
 */
export interface AssetSearchResponse {
  assetId: string
  owner: string | null
  carType: string | null
  carDirector: string | null
  currentLocation: string | null
}

export interface AssetSearchListResponse {
  items: AssetSearchResponse[]
  limit: number
  offset: number
  total: number
}

export interface LocationResponse {
  location: string
}
export interface LocationListResponse {
  items: LocationResponse[]
}

export interface CarTypeResponse {
  carType: string
}
export interface CarTypeListResponse {
  items: CarTypeResponse[]
}

export interface AlertTypeResponse {
  alertType: string
  measurementUnits: string | null
}
export interface AlertTypeListResponse {
  items: AlertTypeResponse[]
}

export interface OwnerResponse {
  owner: string
}
export interface OwnerListResponse {
  items: OwnerResponse[]
}

export interface CarDirectorResponse {
  carDirector: string
}
export interface CarDirectorListResponse {
  items: CarDirectorResponse[]
}

/* ---------- Thresholds ---------- */

export interface ThresholdResponse {
  alertType: string
  thresholdLabel: string
  thresholdMin: number | null
  thresholdMax: number | null
  measurementUnits: string | null
}
export interface ThresholdListResponse {
  items: ThresholdResponse[]
}

export interface ThresholdUpdateRequest {
  thresholdMin?: number | null
  thresholdMax?: number | null
}

/* ---------- Errors ---------- */

export interface ApiErrorResponse {
  status: number
  error: string
  message: string
  path?: string
  timestamp?: string
}
