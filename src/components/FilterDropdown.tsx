/**
 * Generic dropdown used by sidebar refinement rows.
 *
 * Two selection modes:
 *  - single: `value: V | null`, `onChange(V | null)` — picking an option closes
 *    the menu; the top "all" sentinel clears the value.
 *  - multi:  `multi: true`, `value: V[]`, `onChange(V[])` — each option toggles
 *    in place via a checkbox; the menu stays open while the user picks several;
 *    the top "all" sentinel clears the whole selection.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import PortalMenu from './PortalMenu'
import './FilterDropdown.css'

export interface FilterOption<V> {
  value: V
  label: string
  /** Optional right-hand hint (e.g. count, sub-label). */
  hint?: string
}

interface CommonProps<V> {
  allLabel: string
  options: FilterOption<V>[]
  placeholder: string
  icon?: ReactNode
  variant?: 'top' | 'row'
  statusMessage?: string
  disabled?: boolean
}

interface SingleProps<V> extends CommonProps<V> {
  multi?: false
  value: V | null
  onChange: (value: V | null) => void
}

interface MultiProps<V> extends CommonProps<V> {
  multi: true
  value: V[]
  onChange: (value: V[]) => void
}

export type FilterDropdownProps<V> = SingleProps<V> | MultiProps<V>

const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export default function FilterDropdown<V extends string | number>(props: FilterDropdownProps<V>) {
  const {
    allLabel,
    options,
    placeholder,
    icon,
    variant = 'top',
    statusMessage,
    disabled,
  } = props

  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (ref.current && ref.current.contains(target)) return
      if (menuRef.current && menuRef.current.contains(target)) return
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

  // Compute trigger label based on mode.
  let triggerLabel: string
  let hasValue: boolean
  if (props.multi) {
    const selected = props.value
    hasValue = selected.length > 0
    if (selected.length === 0) {
      triggerLabel = placeholder
    } else if (selected.length === 1) {
      triggerLabel = options.find(o => o.value === selected[0])?.label ?? String(selected[0])
    } else {
      triggerLabel = `${selected.length} selected`
    }
  } else {
    const selected = options.find(o => o.value === props.value)
    hasValue = props.value !== null
    triggerLabel = selected?.label ?? placeholder
  }

  const renderOption = (opt: FilterOption<V>) => {
    if (props.multi) {
      const checked = props.value.includes(opt.value)
      return (
        <li key={String(opt.value)}>
          <button
            type="button"
            className={`dd-option dd-option-multi ${checked ? 'dd-option-selected' : ''}`}
            onClick={() => {
              const next = checked
                ? props.value.filter(v => v !== opt.value)
                : [...props.value, opt.value]
              props.onChange(next)
            }}
          >
            <span className={`dd-checkbox ${checked ? 'dd-checkbox-checked' : ''}`}>
              {checked && <CheckIcon />}
            </span>
            <span className="dd-option-label">{opt.label}</span>
            {opt.hint && <span className="dd-option-hint">{opt.hint}</span>}
          </button>
        </li>
      )
    }
    const selectedSingle = opt.value === props.value
    return (
      <li key={String(opt.value)}>
        <button
          type="button"
          className={`dd-option ${selectedSingle ? 'dd-option-selected' : ''}`}
          onClick={() => {
            props.onChange(opt.value)
            setOpen(false)
          }}
        >
          <span className="dd-option-label">{opt.label}</span>
          {opt.hint && <span className="dd-option-hint">{opt.hint}</span>}
        </button>
      </li>
    )
  }

  const handleAllClick = () => {
    if (props.multi) {
      props.onChange([])
      // Stay open: user might want to pick a different combination.
    } else {
      props.onChange(null)
      setOpen(false)
    }
  }

  const allSelected = props.multi ? props.value.length === 0 : props.value === null

  const menuContent = (
    <div ref={menuRef} className={`dd-menu dd-menu-${variant}`} role="listbox">
      {statusMessage ? (
        <div className="dd-status">{statusMessage}</div>
      ) : (
        <ul className="dd-list">
          <li>
            <button
              type="button"
              className={`dd-option ${allSelected ? 'dd-option-selected' : ''}`}
              onClick={handleAllClick}
            >
              {allLabel}
            </button>
          </li>
          {options.map(renderOption)}
        </ul>
      )}
    </div>
  )

  return (
    <div ref={ref} className={`dd dd-${variant} ${open ? 'dd-open' : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        className={`dd-trigger dd-trigger-${variant} ${hasValue ? 'dd-trigger-active' : ''}`}
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
      {variant === 'row'
        ? <PortalMenu anchorRef={triggerRef} open={open}>{menuContent}</PortalMenu>
        : open && menuContent}
    </div>
  )
}
