/** Tiny formatting helpers shared across components. */

/** Returns a coarse "2 min ago" / "3 h ago" / "5 d ago" string. */
export function formatTimeAgo(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return '—'
  const parsed = parseLocalDateTime(iso)
  if (!parsed) return '—'
  const diffMs = now.getTime() - parsed.getTime()
  if (diffMs < 0) return 'just now'
  const s = Math.floor(diffMs / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} h ago`
  const d = Math.floor(h / 24)
  return `${d} d ago`
}

/** Returns a short "09:55 AM" style clock. */
export function formatClock(iso: string | null | undefined): string {
  const parsed = parseLocalDateTime(iso)
  if (!parsed) return '—'
  return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/**
 * The backend emits ISO `LocalDateTime` strings without a timezone. We
 * treat them as local time to avoid off-by-several-hours surprises.
 */
function parseLocalDateTime(value: string | null | undefined): Date | null {
  if (!value) return null
  // If the string already contains a timezone, native Date works.
  const hasZone = /Z$|[+-]\d{2}:?\d{2}$/.test(value)
  const parsed = new Date(hasZone ? value : `${value}`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/** Formats a number with up to one fractional digit; returns `—` for null. */
export function formatGForce(value: number | null | undefined, units: string | null | undefined = 'G'): string {
  if (value === null || value === undefined) return '—'
  const rounded = Math.round(value * 10) / 10
  return `${rounded.toFixed(1)}${units ?? ''}`
}
