/**
 * Top bar = global dashboard scope. Each control writes to `FiltersContext`,
 * which is consumed by Sidebar/DetailPanel via `useMessages(buildMessageFilter(...))`.
 *
 * Fields map to `/api/v1/messages` query params:
 *   All Cars      -> asset_id
 *   All Locations -> location
 *   Severity      -> is_alert / is_priority_alert
 *
 * The time window (`Period`) lives in the left Sidebar now — having it in
 * two places at once confused users (see customer feedback: "Last 7 Days"
 * vs "Period" looked like duplicates).
 *
 * "Clear" resets every filter; "Save View" persists the current state to
 * localStorage (see FiltersContext) — the backend does not expose a
 * server-side preset endpoint yet.
 */
import { useState } from 'react'
import { useFilters, isFiltersActive, type SeverityFilter } from '../FiltersContext'
import { useAssets } from '../hooks/useMessages'
import { useLocations } from '../hooks/useLookups'
import FilterDropdown, { type FilterOption } from './FilterDropdown'
import './TopBar.css'

const SEVERITY_OPTIONS: FilterOption<SeverityFilter>[] = [
  { value: 'alerts', label: 'Alerts only' },
  { value: 'priority', label: 'Priority only' },
]


export default function TopBar() {
  const { filters, setFilter, patch, clear, savedViews, saveView, applyView, deleteView } = useFilters()

  const assetsQuery = useAssets()
  const locationsQuery = useLocations()

  const assetOptions: FilterOption<string>[] =
    assetsQuery.data?.items.map(a => ({
      value: a.assetId,
      label: a.assetId,
      hint: a.carType ?? undefined,
    })) ?? []

  // When the user picks a specific car in the top bar, any left-pane
  // refinements (carType) or other scope filters (location) that would
  // contradict the chosen asset are cleared automatically — otherwise the
  // alerts list silently goes empty and the UX is confusing.
  const handleAssetChange = (assetId: string | null) => {
    if (!assetId) {
      setFilter('assetId', null)
      return
    }
    const asset = assetsQuery.data?.items.find(a => a.assetId === assetId)
    const next: Partial<typeof filters> = { assetId }
    if (asset?.carType && filters.carType && filters.carType !== asset.carType) {
      next.carType = null
    }
    if (asset?.currentLocation && filters.location && filters.location !== asset.currentLocation) {
      next.location = null
    }
    patch(next)
  }

  // Picking a location in the scope: if the currently-pinned asset lives
  // elsewhere, drop the asset pin rather than returning zero results.
  const handleLocationChange = (location: string | null) => {
    if (!location) {
      setFilter('location', null)
      return
    }
    const next: Partial<typeof filters> = { location }
    if (filters.assetId) {
      const asset = assetsQuery.data?.items.find(a => a.assetId === filters.assetId)
      if (asset?.currentLocation && asset.currentLocation !== location) {
        next.assetId = null
      }
    }
    patch(next)
  }

  const locationOptions: FilterOption<string>[] =
    locationsQuery.data?.items.map(l => ({ value: l.location, label: l.location })) ?? []

  const [viewsOpen, setViewsOpen] = useState(false)

  const handleSave = () => {
    const name = window.prompt('Save current filters as…', 'My view')
    if (name === null) return
    saveView(name)
  }

  return (
    <div className="topbar">
      <div className="topbar-dropdowns">
        <FilterDropdown<string>
          allLabel="All Cars"
          placeholder="All Cars"
          options={assetOptions}
          value={filters.assetId}
          onChange={handleAssetChange}
          statusMessage={assetsQuery.isLoading ? 'Loading…' : assetsQuery.error ? 'Failed to load' : undefined}
        />
        <FilterDropdown<string>
          allLabel="All Locations"
          placeholder="All Locations"
          options={locationOptions}
          value={filters.location}
          onChange={handleLocationChange}
          statusMessage={locationsQuery.isLoading ? 'Loading…' : locationsQuery.error ? 'Failed to load' : undefined}
        />
        <FilterDropdown<SeverityFilter>
          allLabel="Any severity"
          placeholder="Any severity"
          options={SEVERITY_OPTIONS}
          value={filters.severity === 'all' ? null : filters.severity}
          onChange={v => setFilter('severity', v ?? 'all')}
        />
      </div>
      <div className="topbar-actions">
        <div className="topbar-saved-wrap">
          <button
            type="button"
            className="topbar-saved"
            onClick={() => setViewsOpen(v => !v)}
            disabled={savedViews.length === 0}
            title={savedViews.length === 0 ? 'No saved views yet' : 'Load saved view'}
          >
            Views ({savedViews.length})
          </button>
          {viewsOpen && savedViews.length > 0 && (
            <div className="topbar-saved-menu">
              {savedViews.map(v => (
                <div key={v.id} className="topbar-saved-item">
                  <button
                    type="button"
                    className="topbar-saved-apply"
                    onClick={() => {
                      applyView(v.id)
                      setViewsOpen(false)
                    }}
                  >
                    {v.name}
                  </button>
                  <button
                    type="button"
                    className="topbar-saved-delete"
                    onClick={() => deleteView(v.id)}
                    aria-label={`Delete ${v.name}`}
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          className="topbar-clear"
          onClick={clear}
          disabled={!isFiltersActive(filters)}
        >
          Clear
        </button>
        <button type="button" className="topbar-save" onClick={handleSave}>
          Save View
        </button>
      </div>
    </div>
  )
}
