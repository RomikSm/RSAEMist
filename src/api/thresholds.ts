/** Threshold endpoints. The exact path follows the backend controller
 *  `@RequestMapping("/api/v1/thresholds")`.
 */
import { request } from './client'
import type {
  ThresholdListResponse,
  ThresholdResponse,
  ThresholdUpdateRequest,
} from './types'

export function getThresholds(signal?: AbortSignal): Promise<ThresholdListResponse> {
  return request<ThresholdListResponse>('/thresholds', { signal })
}

export function updateThreshold(
  alertType: string,
  body: ThresholdUpdateRequest,
  signal?: AbortSignal,
): Promise<ThresholdResponse> {
  return request<ThresholdResponse>(`/thresholds/${encodeURIComponent(alertType)}`, {
    method: 'PUT',
    json: body,
    signal,
  })
}
