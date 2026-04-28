import { useState } from 'react'
import { useTheme } from '../ThemeContext'
import { useAuth } from '../AuthContext'
import { useMessages } from '../hooks/useMessages'
import { useCarTypes, useAlertTypes, useLocations } from '../hooks/useLookups'
import {
  useFilters,
  buildMessageFilter,
  isFiltersActive,
  type SeverityFilter,
} from '../FiltersContext'
// `isFiltersActive` is still used below for Clear button enable/disable.
import FilterDropdown, { type FilterOption } from './FilterDropdown'
import AssetSearchDropdown from './AssetSearchDropdown'
import { formatTimeAgo, formatGForce } from '../utils/format'
import type { MessageResponse } from '../api/types'
import './Sidebar.css'

interface SidebarProps {
  selectedMessageId: string | null
  onSelectMessage: (id: string | null) => void
}

type Severity = 'critical' | 'warning' | 'normal'

function classifySeverity(message: MessageResponse): Severity {
  // Backend may return `effective*` (evaluated against thresholds) or
  // just the raw DB flags `is_alert` / `is_priority_alert`. Prefer the
  // evaluated values when present, otherwise fall back to the flat ones.
  const isPriority = message.effectiveIsPriorityAlert ?? message.isPriorityAlert ?? message.rawIsPriorityAlert ?? false
  const isAlert = message.effectiveIsAlert ?? message.isAlert ?? message.rawIsAlert ?? false
  if (isPriority) return 'critical'
  if (isAlert) return 'warning'
  return 'normal'
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

const severityConfig: Record<Severity, { color: string; bg: string; gradient: string; Icon: typeof AlertCircleIcon }> = {
  critical: { color: 'var(--severity-red)', bg: 'var(--severity-red-bg)', gradient: 'var(--severity-red-gradient)', Icon: AlertCircleIcon },
  warning: { color: 'var(--severity-orange)', bg: 'var(--severity-orange-bg)', gradient: 'var(--severity-orange-gradient)', Icon: AlertCircleIcon },
  normal: { color: 'var(--severity-green)', bg: 'var(--severity-green-bg)', gradient: 'var(--severity-green-gradient)', Icon: CheckCircleIcon },
}

const PERIOD_OPTIONS: FilterOption<number>[] = [
  { value: 1, label: 'Today' },
  { value: 3, label: 'Last 3 days' },
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: -1, label: 'Custom range…' },
]

const SEVERITY_OPTIONS: FilterOption<SeverityFilter>[] = [
  { value: 'alerts', label: 'Alerts only' },
  { value: 'priority', label: 'Priority only' },
]

/* Inline icons used by the new filter rows (Cars / Severity). */
const CarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 17V8l3-4h12l3 4v9" />
    <path d="M5 17h14" />
    <circle cx="6" cy="17" r="2" />
    <circle cx="18" cy="17" r="2" />
  </svg>
)

const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

export default function Sidebar({ selectedMessageId, onSelectMessage }: SidebarProps) {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const {
    filters: scope,
    setFilter,
    clear,
    savedViews,
    saveView,
    applyView,
    deleteView,
  } = useFilters()

  const carTypesQuery = useCarTypes()
  const alertTypesQuery = useAlertTypes()
  const locationsQuery = useLocations()

  const [savedViewsOpen, setSavedViewsOpen] = useState(false)

  const handleSaveView = () => {
    const name = window.prompt('Save current filters as…', 'My view')
    if (name === null) return
    saveView(name)
  }

  const carTypeOptions: FilterOption<string>[] =
    carTypesQuery.data?.items.map(c => ({ value: c.carType, label: c.carType })) ?? []

  const alertTypeOptions: FilterOption<string>[] =
    alertTypesQuery.data?.items.map(a => ({
      value: a.alertType,
      label: a.alertType.charAt(0).toUpperCase() + a.alertType.slice(1),
      hint: a.measurementUnits ?? undefined,
    })) ?? []

  const locationOptions: FilterOption<string>[] =
    locationsQuery.data?.items.map(l => ({ value: l.location, label: l.location })) ?? []

  // The sidebar's "High Priority Alerts" section only ever shows
  // priority (critical / red) alerts — that matches the section title
  // and the customer's expectation. Filters narrow this priority set
  // further (by car type, asset, period, …) but never widen it to
  // include warnings/normal events. Explicit severity selection wins.
  // Multi-select filters now go straight to the backend as repeated
  // query params (`?car_type=A&car_type=B`), which Spring binds into
  // `List<String>` — no client-side post-filter needed.
  const messageFilter = buildMessageFilter(scope, {
    mode: 'RAW',
    limit: 25,
    ...(scope.severity === 'all' ? { isPriorityAlert: true } : {}),
  })
  const { data, error, isLoading } = useMessages(messageFilter)
  const items = data?.items ?? []

  // Note: we intentionally do NOT auto-select the first alert.
  // When nothing is selected, MapPanel renders the latest position of
  // every railcar in the fleet — that is the customer-facing default.
  // The user explicitly clicks an alert to drill down into one car.

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
          <button className="icon-btn" aria-label="Mail" title={user?.login ?? 'Account'}>
            <MailIcon />
          </button>
          <div className="time-badge">
            <ClockIcon />
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <button className="icon-btn theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button className="icon-btn" onClick={logout} aria-label="Sign out" title="Sign out">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Filters — Frame 59/60 in Figma moved every filter into this
          single left-pane block. The previous TopBar dropdowns (All
          Cars / Locations / Severity) are now rows in this list, with
          Clear / Save View buttons at the bottom. */}
      <div className="filters-section">
        <div className="filters-title">Filters</div>

        <FilterDropdown<string>
          multi
          variant="row"
          icon={<TriangleIcon />}
          allLabel="Any car type"
          placeholder="Car type"
          options={carTypeOptions}
          value={scope.carType}
          onChange={v => setFilter('carType', v)}
          statusMessage={carTypesQuery.isLoading ? 'Loading…' : carTypesQuery.error ? 'Failed to load' : undefined}
        />

        <FilterDropdown<string>
          multi
          variant="row"
          icon={<MapPinIcon />}
          allLabel="Any alert type"
          placeholder="Alert Type"
          options={alertTypeOptions}
          value={scope.alertType}
          onChange={v => setFilter('alertType', v)}
          statusMessage={alertTypesQuery.isLoading ? 'Loading…' : alertTypesQuery.error ? 'Failed to load' : undefined}
        />

        <button
          type="button"
          className="filter-row filter-row-disabled"
          disabled
          title="Not available: message_events schema has no load-state field."
        >
          <span className="filter-icon"><LoadIcon /></span>
          <span className="filter-label">Load State</span>
          <span className="filter-hint">n/a</span>
        </button>

        <button
          type="button"
          className="filter-row filter-row-disabled"
          disabled
          title="Not available: no operational-hours data on the backend yet."
        >
          <span className="filter-icon"><ClockFilterIcon /></span>
          <span className="filter-label">Operational Time</span>
          <span className="filter-hint">n/a</span>
        </button>

        <FilterDropdown<number>
          variant="row"
          icon={<CalendarIcon />}
          allLabel="All time"
          placeholder="Period"
          options={PERIOD_OPTIONS}
          value={scope.rangeDays}
          onChange={v => {
            // Switching away from "Custom range…" clears the dates so we
            // don't accidentally keep them in the request.
            if (v !== -1) {
              setFilter('customFrom', null)
              setFilter('customTo', null)
            }
            setFilter('rangeDays', v)
          }}
        />

        {scope.rangeDays === -1 && (
          <div className="filter-custom-range">
            <label className="filter-custom-range-field">
              <span>From</span>
              <input
                type="date"
                lang="en"
                value={scope.customFrom ?? ''}
                max={scope.customTo ?? undefined}
                onChange={e => setFilter('customFrom', e.target.value || null)}
              />
            </label>
            <label className="filter-custom-range-field">
              <span>To</span>
              <input
                type="date"
                lang="en"
                value={scope.customTo ?? ''}
                min={scope.customFrom ?? undefined}
                onChange={e => setFilter('customTo', e.target.value || null)}
              />
            </label>
          </div>
        )}

        {/* All Cars — typeahead instead of a static dropdown because the
            fleet may have thousands of railcars. The list stays empty
            until the user types something. */}
        <AssetSearchDropdown
          icon={<CarIcon />}
          placeholder="All Cars"
          value={scope.assetId}
          onChange={v => setFilter('assetId', v)}
        />

        <FilterDropdown<string>
          multi
          variant="row"
          icon={<MapPinIcon />}
          allLabel="All Locations"
          placeholder="Location"
          options={locationOptions}
          value={scope.location}
          onChange={v => setFilter('location', v)}
          statusMessage={locationsQuery.isLoading ? 'Loading…' : locationsQuery.error ? 'Failed to load' : undefined}
        />

        <FilterDropdown<SeverityFilter>
          variant="row"
          icon={<ShieldIcon />}
          allLabel="Any severity"
          placeholder="Severity"
          options={SEVERITY_OPTIONS}
          value={scope.severity === 'all' ? null : scope.severity}
          onChange={v => setFilter('severity', v ?? 'all')}
        />

        {/* Action row at the bottom of Filters. "Save View" persists to
            localStorage via FiltersContext (the backend has no preset
            endpoint yet). */}
        <div className="filters-actions">
          <button
            type="button"
            className="filters-action-btn filters-action-clear"
            onClick={clear}
            disabled={!isFiltersActive(scope)}
            title={isFiltersActive(scope) ? 'Reset every filter' : 'Filters already cleared'}
          >
            Clear
          </button>
          <button
            type="button"
            className="filters-action-btn filters-action-save"
            onClick={handleSaveView}
          >
            Save View
          </button>
        </div>

        {savedViews.length > 0 && (
          <div className="filters-saved-wrap">
            <button
              type="button"
              className="filters-saved-toggle"
              onClick={() => setSavedViewsOpen(v => !v)}
            >
              Saved views ({savedViews.length})
            </button>
            {savedViewsOpen && (
              <ul className="filters-saved-list">
                {savedViews.map(v => (
                  <li key={v.id} className="filters-saved-item">
                    <button
                      type="button"
                      className="filters-saved-apply"
                      onClick={() => {
                        applyView(v.id)
                        setSavedViewsOpen(false)
                      }}
                    >
                      {v.name}
                    </button>
                    <button
                      type="button"
                      className="filters-saved-delete"
                      onClick={() => deleteView(v.id)}
                      aria-label={`Delete ${v.name}`}
                      title="Delete"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* High Priority Alerts */}
      <div className="alerts-section">
        <div className="alerts-title">High Priority Alerts</div>
        <div className="alerts-list">
          {isLoading && <div className="alerts-placeholder">Loading alerts…</div>}
          {error && (
            <div className="alerts-placeholder alerts-error">
              Failed to load alerts: {error.message}
            </div>
          )}
          {!isLoading && !error && items.length === 0 && (
            <div className="alerts-placeholder">No priority alerts.</div>
          )}
          {items.map(msg => {
            const severity = classifySeverity(msg)
            const cfg = severityConfig[severity]
            const carLabel = msg.carType ?? 'Train Car'
            const carNumber = `#${msg.assetId.slice(-4)}`
            const description = msg.alertType
              ? `${msg.alertType[0].toUpperCase()}${msg.alertType.slice(1)} ${formatGForce(msg.alertValue, msg.measurementUnits)}`
              : formatGForce(msg.alertValue, msg.measurementUnits)
            return (
              <button
                key={msg.messageId}
                className={`alert-card ${selectedMessageId === msg.messageId ? 'selected' : ''}`}
                onClick={() => onSelectMessage(selectedMessageId === msg.messageId ? null : msg.messageId)}
                style={{ backgroundImage: cfg.gradient }}
                title={formatTimeAgo(msg.messageDate)}
              >
                <div className="alert-card-icon" style={{ color: cfg.color }}>
                  <cfg.Icon color={cfg.color} />
                </div>
                <div className="alert-card-content">
                  <div className="alert-card-top">
                    <span className="alert-car-name" style={{ color: cfg.color }}>{carLabel} {msg.assetId}</span>
                    <span className="alert-car-number">{carNumber}</span>
                  </div>
                  <div className="alert-card-desc">{description}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
