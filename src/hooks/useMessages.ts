/** Convenience hooks wrapping the messages/assets endpoints. */
import { useMemo } from 'react'
import { messages, lookups, type MessageFilter } from '../api'
import { useApi } from './useApi'

/**
 * Fetches the filtered message list. `filter` is stabilised with JSON to avoid churn.
 * Pass `enabled=false` to skip the request entirely — preferred over sending a
 * sentinel filter like `limit: 0` which the backend rejects with 400.
 */
export function useMessages(filter: MessageFilter = {}, enabled: boolean = true) {
  // Use JSON key so the caller can pass inline object literals safely.
  const filterKey = useMemo(() => JSON.stringify(filter), [filter])

  return useApi(
    signal => messages.getMessages(JSON.parse(filterKey) as MessageFilter, signal),
    [filterKey],
    enabled,
  )
}

export function useMessage(messageId: string | null) {
  return useApi(
    signal => {
      if (!messageId) return Promise.resolve(null)
      return messages.getMessage(messageId, 'RAW', signal)
    },
    [messageId],
    messageId !== null,
  )
}

export function useAssets() {
  return useApi(signal => lookups.getAssets('RAW', signal), [])
}
