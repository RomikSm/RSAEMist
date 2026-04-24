import { useMemo } from 'react'
import { useMessage, useMessages } from '../hooks/useMessages'
import { formatClock, formatGForce, formatTimeAgo } from '../utils/format'
import './DetailPanel.css'

interface DetailPanelProps {
  selectedMessageId: string | null
}

const AlertCircleSmall = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="var(--severity-red)" strokeWidth="2" />
    <line x1="12" y1="8" x2="12" y2="12" stroke="var(--severity-red)" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="16" r="1" fill="var(--severity-red)" />
  </svg>
)

const ChatIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

export default function DetailPanel({ selectedMessageId }: DetailPanelProps) {
  const { data: selected } = useMessage(selectedMessageId)
  const assetId = selected?.assetId

  // Impact events for the selected asset (always evaluated in RAW mode
  // so the list is not limited by thresholds — matches the "history" label).
  const impactQuery = useMessages(
    assetId ? { assetId, alertType: 'impact', limit: 10, mode: 'RAW' } : {},
    Boolean(assetId),
  )
  const impactEvents = useMemo(() => {
    if (!assetId) return []
    return impactQuery.data?.items.filter(item => item.effectiveIsAlert) ?? []
  }, [assetId, impactQuery.data])

  // Recent non-alert notifications for the selected asset.
  const messagesQuery = useMessages(
    assetId ? { assetId, isAlert: false, limit: 6, mode: 'RAW' } : {},
    Boolean(assetId),
  )
  const notifications = messagesQuery.data?.items ?? []

  return (
    <aside className="detail-panel">
      {/* Alert History */}
      <div className="detail-section">
        <div className="detail-section-header">
          <h3 className="detail-section-title">Alert History</h3>
          <p className="detail-section-subtitle">(Historic list of "Impact" alert events)</p>
        </div>
        <div className="alert-history-list">
          {!assetId && <div className="detail-placeholder">Select an alert to view history.</div>}
          {assetId && impactQuery.isLoading && <div className="detail-placeholder">Loading…</div>}
          {assetId && impactQuery.error && (
            <div className="detail-placeholder detail-error">
              {impactQuery.error.message}
            </div>
          )}
          {assetId && !impactQuery.isLoading && !impactQuery.error && impactEvents.length === 0 && (
            <div className="detail-placeholder">No impact events.</div>
          )}
          {impactEvents.map(event => (
            <div key={event.messageId} className="alert-history-row">
              <AlertCircleSmall />
              <span className="alert-history-gforce">
                {formatGForce(event.alertValue, event.measurementUnits)}
              </span>
              <span className="alert-history-time">{formatClock(event.messageDate)}</span>
            </div>
          ))}
        </div>
        <button className="view-all-btn" disabled={!assetId}>View All</button>
      </div>

      {/* Message History */}
      <div className="detail-section">
        <div className="detail-section-header">
          <h3 className="detail-section-title">Message History</h3>
          <p className="detail-section-subtitle">Historic list of all notifications</p>
        </div>
        <div className="message-history-list">
          {!assetId && <div className="detail-placeholder">Select an alert to view messages.</div>}
          {assetId && messagesQuery.isLoading && <div className="detail-placeholder">Loading…</div>}
          {assetId && messagesQuery.error && (
            <div className="detail-placeholder detail-error">
              {messagesQuery.error.message}
            </div>
          )}
          {assetId && !messagesQuery.isLoading && !messagesQuery.error && notifications.length === 0 && (
            <div className="detail-placeholder">No messages.</div>
          )}
          {notifications.map(msg => (
            <div key={msg.messageId} className="message-card">
              <div className="message-card-header">
                <ChatIcon />
                <span className="message-car-name">{msg.carType ?? 'Railcar'} {msg.assetId}</span>
                <span className="message-time">{formatTimeAgo(msg.messageDate)}</span>
              </div>
              <div className="message-location">{msg.location ?? '—'}</div>
              <div className="message-text">
                • {msg.alertType ?? 'telemetry'}: {formatGForce(msg.alertValue, msg.measurementUnits)}
              </div>
            </div>
          ))}
        </div>
        <button className="view-all-btn" disabled={!assetId}>View All</button>
      </div>
    </aside>
  )
}
