/**
 * Read-only lookup hooks that populate filter dropdowns.
 *
 * Each lookup endpoint on the backend is cheap and cache-friendly, so a
 * single `useApi` call per provider is fine. The heavier `/assets`
 * endpoint lives in `useMessages.ts::useAssets`.
 */
import { lookups } from '../api'
import { useApi } from './useApi'

export function useLocations() {
  return useApi(signal => lookups.getLocations(signal), [])
}

export function useCarTypes() {
  return useApi(signal => lookups.getCarTypes(signal), [])
}

export function useAlertTypes() {
  return useApi(signal => lookups.getAlertTypes(signal), [])
}

export function useOwners() {
  return useApi(signal => lookups.getOwners(signal), [])
}

export function useCarDirectors() {
  return useApi(signal => lookups.getCarDirectors(signal), [])
}
