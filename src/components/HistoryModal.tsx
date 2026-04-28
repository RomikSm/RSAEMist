import { useEffect, useState } from 'react'
import { useMessages } from '../hooks/useMessages'
import type { MessageFilter, MessageResponse } from '../api/types'
import { formatClock, formatGForce, formatTimeAgo } from '../utils/format'
import './HistoryModal.css'

const PAGE_SIZE = 10

interface HistoryModalProps {
  title: string
  /** Base filter (without limit/offset). limit/offset are added by the modal. */
  filter: MessageFilter
  /** Render one row inside the list. */
  renderRow: (msg: MessageResponse) => React.ReactNode
  onClose: () => void
}

export default function HistoryModal({ title, filter, renderRow, onClose }: HistoryModalProps) {
  const [page, setPage] = useState(0)

  // Reset to first page whenever filters change.
  useEffect(() => {
    setPage(0)
  }, [JSON.stringify(filter)]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Fetch one extra row to know whether there is a next page (the
  // backend doesn't return a total count). If we get PAGE_SIZE+1 rows,
  // there is more; we then drop the extra row before rendering.
  const pagedFilter: MessageFilter = {
    ...filter,
    limit: PAGE_SIZE + 1,
    offset: page * PAGE_SIZE,
  }
  const { data, error, isLoading } = useMessages(pagedFilter)
  const allItems = data?.items ?? []
  const items = allItems.slice(0, PAGE_SIZE)
  const hasNext = allItems.length > PAGE_SIZE
  const hasPrev = page > 0

  return (
    <div className="hm-overlay" onClick={onClose}>
      <div className="hm-dialog" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="hm-header">
          <div>
            <h2 className="hm-title">{title}</h2>
          </div>
          <button className="hm-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="hm-body">
          {isLoading && <div className="hm-placeholder">Loading…</div>}
          {error && <div className="hm-placeholder hm-error">{error.message}</div>}
          {!isLoading && !error && items.length === 0 && (
            <div className="hm-placeholder">No records.</div>
          )}
          {!isLoading && !error && items.map(msg => (
            <div key={msg.messageId} className="hm-row">
              {renderRow(msg)}
            </div>
          ))}
        </div>

        <div className="hm-footer">
          <span className="hm-page-info">Page {page + 1}</span>
          <div className="hm-pager">
            <button
              type="button"
              className="hm-page-btn"
              disabled={!hasPrev || isLoading}
              onClick={() => setPage(p => Math.max(0, p - 1))}
            >
              ← Prev
            </button>
            <button
              type="button"
              className="hm-page-btn"
              disabled={!hasNext || isLoading}
              onClick={() => setPage(p => p + 1)}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* Reusable row renderers shared with the inline preview in DetailPanel. */

export function ImpactHistoryRow({ msg }: { msg: MessageResponse }) {
  return (
    <>
      <span className="hm-impact-icon" aria-hidden>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="var(--severity-red)" strokeWidth="2" />
          <line x1="12" y1="8" x2="12" y2="12" stroke="var(--severity-red)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="16" r="1" fill="var(--severity-red)" />
        </svg>
      </span>
      <span className="hm-impact-asset">{msg.assetId}</span>
      <span className="hm-impact-value">{formatGForce(msg.alertValue, msg.measurementUnits)}</span>
      <span className="hm-impact-loc">{msg.location ?? '—'}</span>
      <span className="hm-impact-time">{formatClock(msg.messageDate)}</span>
    </>
  )
}

export function MessageHistoryRow({ msg }: { msg: MessageResponse }) {
  return (
    <div className="hm-message-card">
      <div className="hm-message-head">
        <span className="hm-message-name">{msg.carType ?? 'Railcar'} {msg.assetId}</span>
        <span className="hm-message-time">{formatTimeAgo(msg.messageDate)}</span>
      </div>
      <div className="hm-message-loc">{msg.location ?? '—'}</div>
      <div className="hm-message-text">
        • {msg.alertType ?? 'telemetry'}: {formatGForce(msg.alertValue, msg.measurementUnits)}
      </div>
    </div>
  )
}
