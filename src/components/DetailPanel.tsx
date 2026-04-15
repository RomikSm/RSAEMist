import { shockEvents, messages } from '../data'
import './DetailPanel.css'

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
  return (
    <aside className="detail-panel">
      {/* Alert History */}
      <div className="detail-section">
        <div className="detail-section-header">
          <h3 className="detail-section-title">Alert History</h3>
          <p className="detail-section-subtitle">(Historic list of "Impact" alert events)</p>
        </div>
        <div className="alert-history-list">
          {shockEvents.map((event, i) => (
            <div key={i} className="alert-history-row">
              <AlertCircleSmall />
              <span className="alert-history-gforce">{event.gForce}</span>
              <span className="alert-history-time">{event.time}</span>
            </div>
          ))}
        </div>
        <button className="view-all-btn">View All</button>
      </div>

      {/* Message History */}
      <div className="detail-section">
        <div className="detail-section-header">
          <h3 className="detail-section-title">Messagge History</h3>
          <p className="detail-section-subtitle">Historic list of all notifications</p>
        </div>
        <div className="message-history-list">
          {messages.map((msg, i) => (
            <div key={i} className="message-card">
              <div className="message-card-header">
                <ChatIcon />
                <span className="message-car-name">{msg.carName}</span>
                <span className="message-time">{msg.timeAgo}</span>
              </div>
              <div className="message-location">{msg.location}</div>
              <div className="message-text">• {msg.text}</div>
            </div>
          ))}
        </div>
        <button className="view-all-btn">View All</button>
      </div>
    </aside>
  )
}
