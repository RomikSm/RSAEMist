/** Message endpoints: list with filtering + detail by id. */
import { request } from './client'
import type {
  AlertEvaluationMode,
  MessageFilter,
  MessageListResponse,
  MessageResponse,
} from './types'

/** Maps a camelCase filter onto the snake_case query params expected by the backend. */
function toQuery(filter: MessageFilter): Record<string, string | number | boolean | undefined> {
  return {
    asset_id: filter.assetId,
    is_alert: filter.isAlert,
    is_priority_alert: filter.isPriorityAlert,
    mode: filter.mode,
    alert_type: filter.alertType,
    car_type: filter.carType,
    owner: filter.owner,
    car_director: filter.carDirector,
    location: filter.location,
    from: filter.from,
    to: filter.to,
    limit: filter.limit,
    offset: filter.offset,
  }
}

export function getMessages(
  filter: MessageFilter = {},
  signal?: AbortSignal,
): Promise<MessageListResponse> {
  return request<MessageListResponse>('/messages', { query: toQuery(filter), signal })
}

export function getMessage(
  messageId: string,
  mode: AlertEvaluationMode = 'RAW',
  signal?: AbortSignal,
): Promise<MessageResponse> {
  return request<MessageResponse>(`/messages/${encodeURIComponent(messageId)}`, {
    query: { mode },
    signal,
  })
}
