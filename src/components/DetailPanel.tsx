import { useMemo, useState } from 'react'
import { useMessages } from '../hooks/useMessages'
import { useFilters, buildMessageFilter } from '../FiltersContext'
import { formatClock, formatGForce, formatTimeAgo } from '../utils/format'
import HistoryModal, { ImpactHistoryRow, MessageHistoryRow } from './HistoryModal'
import type { MessageFilter } from '../api/types'
import './DetailPanel.css'

const PREVIEW_SIZE = 5

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

export default function DetailPanel() {
  const { filters: scope } = useFilters()
  const [openModal, setOpenModal] = useState<null | 'alerts' | 'messages'>(null)

  // Alert History — last 5 impact alerts matching the global filters.
  // Impact only (matches the section subtitle), is_alert=true so we
  // don't pull in non-alerting telemetry.
  const alertsBaseFilter = useMemo<MessageFilter>(
    () => buildMessageFilter(scope, { alertType: 'impact', isAlert: true }),
    [scope],
  )
  const alertsPreview = useMessages({ ...alertsBaseFilter, limit: PREVIEW_SIZE })

  // Message History — last 5 messages matching the global filters,
  // without forcing the alert flag (this is the "all notifications" list).
  const messagesBaseFilter = useMemo<MessageFilter>(
    () => buildMessageFilter(scope),
    [scope],
  )
  const messagesPreview = useMessages({ ...messagesBaseFilter, limit: PREVIEW_SIZE })

  const alertItems = alertsPreview.data?.items ?? []
  const messageItems = messagesPreview.data?.items ?? []

  return (
    <aside className="detail-panel">
      {/* Alert History */}
      <div className="detail-section">
        <div className="detail-section-header">
          <h3 className="detail-section-title">Alert History</h3>
          <p className="detail-section-subtitle">(Recent "Impact" alert events)</p>
        </div>
        <div className="alert-history-list">
          {alertsPreview.isLoading && <div className="detail-placeholder">Loading…</div>}
          {alertsPreview.error && (
            <div className="detail-placeholder detail-error">
              {alertsPreview.error.message}
            </div>
          )}
          {!alertsPreview.isLoading && !alertsPreview.error && alertItems.length === 0 && (
            <div className="detail-placeholder">No impact events.</div>
          )}
          {alertItems.map(event => (
            <div key={event.messageId} className="alert-history-row">
              <AlertCircleSmall />
              <span className="alert-history-gforce">
                {formatGForce(event.alertValue, event.measurementUnits)}
              </span>
              <span className="alert-history-time">{formatClock(event.messageDate)}</span>
            </div>
          ))}
        </div>
        <button
          className="view-all-btn"
          onClick={() => setOpenModal('alerts')}
          disabled={alertItems.length === 0}
        >
          View All
        </button>
      </div>

      {/* Message History */}
      <div className="detail-section">
        <div className="detail-section-header">
          <h3 className="detail-section-title">Message History</h3>
          <p className="detail-section-subtitle">Recent notifications</p>
        </div>
        <div className="message-history-list">
          {messagesPreview.isLoading && <div className="detail-placeholder">Loading…</div>}
          {messagesPreview.error && (
            <div className="detail-placeholder detail-error">
              {messagesPreview.error.message}
            </div>
          )}
          {!messagesPreview.isLoading && !messagesPreview.error && messageItems.length === 0 && (
            <div className="detail-placeholder">No messages.</div>
          )}
          {messageItems.map(msg => (
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
        <button
          className="view-all-btn"
          onClick={() => setOpenModal('messages')}
          disabled={messageItems.length === 0}
        >
          View All
        </button>
      </div>

      {openModal === 'alerts' && (
        <HistoryModal
          title="Alert History"
          filter={alertsBaseFilter}
          renderRow={msg => <ImpactHistoryRow msg={msg} />}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === 'messages' && (
        <HistoryModal
          title="Message History"
          filter={messagesBaseFilter}
          renderRow={msg => <MessageHistoryRow msg={msg} />}
          onClose={() => setOpenModal(null)}
        />
      )}
    </aside>
  )
}
