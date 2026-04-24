/**
 * Generic single-select dropdown used by the top-bar scope filters and by
 * the sidebar refinement rows. The look matches the existing Figma design
 * (chevron button + floating panel), and we render a plain `<ul>` with
 * keyboard-less selection to keep the component tiny — the dashboard is
 * mouse-driven. Selection of the `null`-value option clears the filter.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import './FilterDropdown.css'

export interface FilterOption<V> {
  value: V
  label: string
  /** Optional right-hand hint (e.g. count, sub-label). */
  hint?: string
}

export interface FilterDropdownProps<V> {
  /** The clear/"all" sentinel shown at the top of the list. */
  allLabel: string
  options: FilterOption<V>[]
  value: V | null
  onChange: (value: V | null) => void
  /** Label shown when nothing is selected (e.g. "All Cars"). */
  placeholder: string
  /** Custom icon placed on the left of the trigger. */
  icon?: ReactNode
  /** Visual variant — "top" is the pill used in the TopBar, "row" is the left sidebar filter row. */
  variant?: 'top' | 'row'
  /** Short status message shown instead of options while loading / on error. */
  statusMessage?: string
  disabled?: boolean
}

const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

export default function FilterDropdown<V extends string | number>({
  allLabel,
  options,
  value,
  onChange,
  placeholder,
  icon,
  variant = 'top',
  statusMessage,
  disabled,
}: FilterDropdownProps<V>) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  // Close on outside click or Escape — standard dropdown behaviour.
  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
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

  const selected = options.find(o => o.value === value)
  const triggerLabel = selected?.label ?? placeholder

  return (
    <div ref={ref} className={`dd dd-${variant} ${open ? 'dd-open' : ''}`}>
      <button
        type="button"
        className={`dd-trigger dd-trigger-${variant} ${value !== null ? 'dd-trigger-active' : ''}`}
        onClick={() => !disabled && setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        title={triggerLabel}
      >
        {icon && <span className="dd-icon">{icon}</span>}
        <span className="dd-label">{triggerLabel}</span>
        <span className="dd-chevron"><ChevronDown /></span>
      </button>
      {open && (
        <div className="dd-menu" role="listbox">
          {statusMessage ? (
            <div className="dd-status">{statusMessage}</div>
          ) : (
            <ul className="dd-list">
              <li>
                <button
                  type="button"
                  className={`dd-option ${value === null ? 'dd-option-selected' : ''}`}
                  onClick={() => {
                    onChange(null)
                    setOpen(false)
                  }}
                >
                  {allLabel}
                </button>
              </li>
              {options.map(opt => (
                <li key={String(opt.value)}>
                  <button
                    type="button"
                    className={`dd-option ${opt.value === value ? 'dd-option-selected' : ''}`}
                    onClick={() => {
                      onChange(opt.value)
                      setOpen(false)
                    }}
                  >
                    <span className="dd-option-label">{opt.label}</span>
                    {opt.hint && <span className="dd-option-hint">{opt.hint}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
