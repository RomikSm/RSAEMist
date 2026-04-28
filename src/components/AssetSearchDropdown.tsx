/**
 * Typeahead dropdown for the "All Cars" filter.
 *
 * The fleet is expected to grow into the thousands of railcars, so we
 * cannot ship the full list to the client. Instead the dropdown stays
 * empty until the user starts typing — keystrokes are debounced (~250ms)
 * and dispatched to `GET /api/v1/assets/search?q=...`. Backed by
 * `searchAssets()` from `api/lookups`.
 *
 * The component is intentionally separate from the generic
 * `FilterDropdown` because the open/empty/loading semantics differ
 * (no "Any" sentinel, no static option list, async data, debounce).
 */
import { useEffect, useRef, useState } from 'react'
import { searchAssets } from '../api/lookups'
import { ApiError } from '../api'
import type { AssetSearchResponse } from '../api/types'
import PortalMenu from './PortalMenu'
import './FilterDropdown.css'

interface AssetSearchDropdownProps {
  /** Currently selected `assetId`, or `null` for "all cars". */
  value: string | null
  onChange: (assetId: string | null) => void
  /** Optional left icon (matches the other Sidebar filter rows). */
  icon?: React.ReactNode
  placeholder?: string
}

const SEARCH_DEBOUNCE_MS = 250
const SEARCH_LIMIT = 20

export default function AssetSearchDropdown({
  value,
  onChange,
  icon,
  placeholder = 'All Cars',
}: AssetSearchDropdownProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AssetSearchResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Close on outside click / Escape — same convention as FilterDropdown.
  // The menu is portalled into document.body, so we have to also check
  // its node, otherwise clicking inside the popover would dismiss it.
  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (wrapRef.current && wrapRef.current.contains(t)) return
      if (menuRef.current && menuRef.current.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Focus the input once the popover opens, so the user can start
  // typing immediately (the whole point of a typeahead).
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Debounced async search. Empty query → empty list, no request fired
  // (the backend rejects blank `q` with 400 anyway).
  useEffect(() => {
    if (!open) return
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      setLoading(false)
      setError(null)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    const handle = window.setTimeout(() => {
      searchAssets(trimmed, SEARCH_LIMIT, 0, controller.signal)
        .then(resp => {
          if (controller.signal.aborted) return
          setResults(resp.items)
          setLoading(false)
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return
          if (err instanceof DOMException && err.name === 'AbortError') return
          setError(err instanceof ApiError ? err.message : 'Failed to search')
          setLoading(false)
        })
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      window.clearTimeout(handle)
      controller.abort()
    }
  }, [query, open])

  const triggerLabel = value ?? placeholder
  const hasSelection = value !== null
  const trimmed = query.trim()

  return (
    <div ref={wrapRef} className={`dd dd-row ${open ? 'dd-open' : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        className={`dd-trigger dd-trigger-row ${hasSelection ? 'dd-trigger-active' : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={triggerLabel}
      >
        {icon && <span className="dd-icon">{icon}</span>}
        <span className="dd-label">{triggerLabel}</span>
        {hasSelection && (
          <span
            role="button"
            tabIndex={0}
            className="dd-clear"
            aria-label="Clear selection"
            onClick={e => {
              // The trigger toggles open; clicking the × should clear
              // selection without opening/closing the dropdown.
              e.stopPropagation()
              onChange(null)
              setQuery('')
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                onChange(null)
                setQuery('')
              }
            }}
          >
            ×
          </span>
        )}
        <span className="dd-chevron">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>
      <PortalMenu anchorRef={triggerRef} open={open}>
        <div ref={menuRef} className="dd-menu dd-menu-row" role="listbox">
          <div className="dd-search">
            <input
              ref={inputRef}
              type="text"
              className="dd-search-input"
              placeholder="Type to search cars (e.g. RC-CA-001)…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          {!trimmed && (
            <div className="dd-status dd-status-hint">
              Start typing to search cars.
            </div>
          )}
          {trimmed && loading && <div className="dd-status">Searching…</div>}
          {trimmed && !loading && error && (
            <div className="dd-status dd-status-error">{error}</div>
          )}
          {trimmed && !loading && !error && results.length === 0 && (
            <div className="dd-status">No matches.</div>
          )}
          {trimmed && !loading && !error && results.length > 0 && (
            <ul className="dd-list">
              {results.map(asset => (
                <li key={asset.assetId}>
                  <button
                    type="button"
                    className={`dd-option ${asset.assetId === value ? 'dd-option-selected' : ''}`}
                    onClick={() => {
                      onChange(asset.assetId)
                      setOpen(false)
                      setQuery('')
                    }}
                  >
                    <span className="dd-option-label">{asset.assetId}</span>
                    {asset.carType && (
                      <span className="dd-option-hint">{asset.carType}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PortalMenu>
    </div>
  )
}
