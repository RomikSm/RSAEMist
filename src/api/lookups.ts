/** Lookup endpoints used to populate filter dropdowns and dashboards. */
import { request } from './client'
import type {
  AlertEvaluationMode,
  AlertTypeListResponse,
  AssetListResponse,
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
