/** Message endpoints: list with filtering + detail by id. */
import { request } from './client'
import type {
  AlertEvaluationMode,
  MessageFilter,
  MessageListResponse,
  MessageResponse,
} from './types'

type QueryValue =
  | string
  | number
  | boolean
  | undefined
  | ReadonlyArray<string | number | boolean>

/**
 * Maps a camelCase filter onto the snake_case query params expected by
 * the backend. Multi-value fields (assetId / alertType / carType /
 * location / owner / carDirector) pass through as arrays — `client.ts`
 * serialises them as repeated query params (`?k=a&k=b`), which is what
 * Spring's `List<String>` `@RequestParam` binders expect.
 */
function toQuery(filter: MessageFilter): Record<string, QueryValue> {
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
