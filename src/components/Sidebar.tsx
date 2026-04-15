import { useTheme } from '../ThemeContext'
import { alerts } from '../data'
import './Sidebar.css'

interface SidebarProps {
  selectedAlertId: string
  onSelectAlert: (id: string) => void
}

/* Simple inline SVG icons matching the Figma design */
const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
)

const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
)

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

const ChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

/* Filter icons */
const TriangleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
  </svg>
)

const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

const LoadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
  </svg>
)

const ClockFilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const AlertCircleIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <line x1="12" y1="8" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="16" r="1" fill={color} />
  </svg>
)

const CheckCircleIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <polyline points="9 12 11 14 15 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
)

const severityConfig = {
  critical: { color: 'var(--severity-red)', bg: 'var(--severity-red-bg)', gradient: 'var(--severity-red-gradient)', Icon: AlertCircleIcon },
  warning: { color: 'var(--severity-orange)', bg: 'var(--severity-orange-bg)', gradient: 'var(--severity-orange-gradient)', Icon: AlertCircleIcon },
  info: { color: 'var(--severity-green)', bg: 'var(--severity-green-bg)', gradient: 'var(--severity-green-gradient)', Icon: CheckCircleIcon },
  normal: { color: 'var(--severity-green)', bg: 'var(--severity-green-bg)', gradient: 'var(--severity-green-gradient)', Icon: CheckCircleIcon },
}

const filters = [
  { label: 'Car type', icon: <TriangleIcon /> },
  { label: 'Location', icon: <MapPinIcon /> },
  { label: 'Load State', icon: <LoadIcon /> },
  { label: 'Operational Time', icon: <ClockFilterIcon /> },
  { label: 'Period', icon: <CalendarIcon /> },
]

export default function Sidebar({ selectedAlertId, onSelectAlert }: SidebarProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-header-left">
          <div className="logo-area">
            <span className="logo-text">RSAEmist<sup>®</sup></span>
            <span className="logo-sub">ALERT REVIEW</span>
          </div>
        </div>
        <div className="sidebar-header-right">
          <button className="icon-btn" aria-label="Mail">
            <MailIcon />
          </button>
          <div className="time-badge">
            <ClockIcon />
            <span>1:22 AM</span>
          </div>
          <button className="icon-btn theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-title">Filters</div>
        {filters.map(f => (
          <button key={f.label} className="filter-row">
            <span className="filter-icon">{f.icon}</span>
            <span className="filter-label">{f.label}</span>
            <span className="filter-chevron"><ChevronDown /></span>
          </button>
        ))}
      </div>

      {/* High Priority Alerts */}
      <div className="alerts-section">
        <div className="alerts-title">High Priority Alerts</div>
        <div className="alerts-list">
          {alerts.map(alert => {
            const cfg = severityConfig[alert.severity]
            return (
              <button
                key={alert.id}
                className={`alert-card ${selectedAlertId === alert.id ? 'selected' : ''}`}
                onClick={() => onSelectAlert(alert.id)}
                style={{ backgroundImage: cfg.gradient }}
              >
                <div className="alert-card-icon" style={{ color: cfg.color }}>
                  <cfg.Icon color={cfg.color} />
                </div>
                <div className="alert-card-content">
                  <div className="alert-card-top">
                    <span className="alert-car-name" style={{ color: cfg.color }}>{alert.carName}</span>
                    <span className="alert-car-number">{alert.carNumber}</span>
                  </div>
                  <div className="alert-card-desc">{alert.description}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
