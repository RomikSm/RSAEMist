/** Lookup endpoints used to populate filter dropdowns and dashboards. */
import { request } from './client'
import type {
  AlertEvaluationMode,
  AlertTypeListResponse,
  AssetListResponse,
  AssetSearchListResponse,
  CarDirectorListResponse,
  CarTypeListResponse,
  LocationListResponse,
  OwnerListResponse,
} from './types'

export function getAssets(
  mode: AlertEvaluationMode = 'RAW',
  signal?: AbortSignal,
): Promise<AssetListResponse> {
  return request<AssetListResponse>('/assets', { query: { mode }, signal })
}

/**
 * Typeahead lookup for the "All Cars" filter. The backend rejects blank
 * queries with `400`, so callers should only invoke this once the user
 * has typed something — the dropdown displays an empty list otherwise.
 */
export function searchAssets(
  query: string,
  limit: number = 20,
  offset: number = 0,
  signal?: AbortSignal,
): Promise<AssetSearchListResponse> {
  return request<AssetSearchListResponse>('/assets/search', {
    query: { q: query, limit, offset },
    signal,
  })
}

export function getLocations(signal?: AbortSignal): Promise<LocationListResponse> {
  return request<LocationListResponse>('/locations', { signal })
}

export function getCarTypes(signal?: AbortSignal): Promise<CarTypeListResponse> {
  return request<CarTypeListResponse>('/car-types', { signal })
}

export function getAlertTypes(signal?: AbortSignal): Promise<AlertTypeListResponse> {
  return request<AlertTypeListResponse>('/alert-types', { signal })
}

export function getOwners(signal?: AbortSignal): Promise<OwnerListResponse> {
  return request<OwnerListResponse>('/owners', { signal })
}

export function getCarDirectors(signal?: AbortSignal): Promise<CarDirectorListResponse> {
  return request<CarDirectorListResponse>('/car-directors', { signal })
}
