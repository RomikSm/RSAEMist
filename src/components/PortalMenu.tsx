/**
 * Portal-based floating menu for the sidebar dropdowns.
 *
 * The sidebar has `overflow: hidden`, so a popover that opens to the
 * right of a filter row would either be clipped by the sidebar or, if
 * its absolute positioning escaped the wrapper, push the layout. To
 * decouple the popover from the sidebar layout entirely, we render it
 * into `document.body` via a React portal and place it with
 * `position: fixed` next to the trigger using its bounding rect.
 *
 * The menu is repositioned on window resize / scroll so it tracks the
 * trigger while open.
 */
import { useEffect, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'

interface PortalMenuProps {
  /** Trigger element to anchor the menu to. */
  anchorRef: RefObject<HTMLElement>
  open: boolean
  children: ReactNode
  /** Optional className applied to the floating wrapper. */
  className?: string
  /** Horizontal gap between trigger and menu, px. */
  gap?: number
  /** Min width of the menu. */
  minWidth?: number
}

interface Pos {
  top: number
  left: number
}

export default function PortalMenu({
  anchorRef,
  open,
  children,
  className = '',
  gap = 8,
  minWidth = 240,
}: PortalMenuProps) {
  const [pos, setPos] = useState<Pos | null>(null)

  useEffect(() => {
    if (!open) {
      setPos(null)
      return
    }
    const update = () => {
      const el = anchorRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      // Default: open to the right of the trigger. If there isn't
      // enough room on the right (e.g. narrow viewport), fall back to
      // opening below the trigger so the menu stays visible.
      const wantedLeft = rect.right + gap
      const fitsRight = wantedLeft + minWidth <= window.innerWidth - 8
      const top = fitsRight ? rect.top : rect.bottom + 6
      const left = fitsRight
        ? wantedLeft
        : Math.max(8, Math.min(rect.left, window.innerWidth - minWidth - 8))
      setPos({ top, left })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, anchorRef, gap, minWidth])

  if (!open || !pos) return null

  return createPortal(
    <div
      className={`dd-portal ${className}`}
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 1000 }}
    >
      {children}
    </div>,
    document.body,
  )
}
