'use client'

import React from 'react'

/* ── Icons ── */
const FB_ICONS: Record<string, React.ReactNode> = {
  dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>,
  inbox:     <><path d="M3 12 5.5 5.5A2 2 0 0 1 7.4 4h9.2a2 2 0 0 1 1.9 1.5L21 12v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 12h5l1.5 2.5h5L16 12h5"/></>,
  progress:  <><path d="M12 3a9 9 0 1 0 9 9"/><path d="M12 7v5l3 2"/></>,
  check:     <><path d="M20 6 9 17l-5-5"/></>,
  x:         <><path d="M18 6 6 18M6 6l12 12"/></>,
  bug:       <><rect x="8" y="6" width="8" height="13" rx="4"/><path d="M8 12H3M21 12h-5M9 7 7 5M15 7l2-2M8 16H4M20 16h-4M9.5 4.5a2.5 2.5 0 0 1 5 0"/></>,
  feature:   <><path d="m12 3 2.2 5.3L20 9l-4 3.9.9 5.6L12 16l-4.9 2.5L8 12.9 4 9l5.8-.7z"/></>,
  design:    <><circle cx="12" cy="12" r="9"/><circle cx="9" cy="9" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1.4" fill="currentColor" stroke="none"/><path d="M9 15c.8 1 2 1.5 3 1.5s2.2-.5 3-1.5"/></>,
  ux:        <><path d="M5 4 19 11l-6 1.5L11 19z"/></>,
  text:      <><path d="M5 6h14M5 6v-.5M9 6v13M12 6v13M9 19h3"/><path d="M4 6V4h16v2"/></>,
  search:    <><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>,
  chevronRight: <><path d="m9 6 6 6-6 6"/></>,
  chevronDown:  <><path d="m6 9 6 6 6-6"/></>,
  arrowLeft:    <><path d="M19 12H5M12 19l-7-7 7-7"/></>,
  arrowUpRight: <><path d="M7 17 17 7M8 7h9v9"/></>,
  moon:      <><path d="M21 12.8A8 8 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8z"/></>,
  sun:       <><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></>,
  logout:    <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></>,
  mail:      <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6 8.5-6"/></>,
  monitor:   <><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></>,
  globe:     <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 2.5 15.5 0 18M12 3c-2.5 2.5-2.5 15.5 0 18"/></>,
  calendar:  <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></>,
  filter:    <><path d="M3 5h18l-7 8v6l-4-2v-4z"/></>,
  flag:      <><path d="M5 21V4M5 4h11l-2 3.5L16 11H5"/></>,
  plus:      <><path d="M12 5v14M5 12h14"/></>,
  pin:       <><path d="M12 21s7-6.4 7-11a7 7 0 1 0-14 0c0 4.6 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></>,
  dots:      <><circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/></>,
  layers:    <><path d="m12 3 9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 18l9 5 9-5"/></>,
  trend:     <><path d="M3 17l5-5 4 4 8-8M21 8h-4M21 8v4"/></>,
  external:  <><path d="M14 4h6v6M20 4l-9 9M16 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/></>,
  comment:   <><path d="M21 12a8 8 0 0 1-11.3 7.3L4 21l1.7-5.7A8 8 0 1 1 21 12z"/></>,
}

export function Icon({ name, size = 18, className = '', style = {} }: {
  name: string
  size?: number
  className?: string
  style?: React.CSSProperties
}) {
  const p = FB_ICONS[name]
  if (!p) return null
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {p}
    </svg>
  )
}

/* ── Category & status maps ── */

export const CAT_ICON: Record<string, string> = {
  bug: 'bug', feature: 'feature', design: 'design', ux: 'ux', text: 'text',
}

export const STATUS_ICON: Record<string, string> = {
  new: 'inbox', in_progress: 'progress', resolved: 'check', dismissed: 'x',
}

export type CategoryId = 'bug' | 'feature' | 'design' | 'ux' | 'text'
export type StatusId   = 'new' | 'in_progress' | 'resolved' | 'dismissed'

export const CATEGORIES: Record<CategoryId, { label: string; hue: number; desc: string }> = {
  bug:     { label: 'Bug',     hue: 26,  desc: 'Nahlášené chyby' },
  feature: { label: 'Feature', hue: 150, desc: 'Návrhy funkcí' },
  design:  { label: 'Design',  hue: 300, desc: 'Designové podněty' },
  ux:      { label: 'UX',      hue: 235, desc: 'Použitelnost' },
  text:    { label: 'Text',    hue: 70,  desc: 'Texty a překlepy' },
}

export const STATUSES: Record<StatusId, { label: string; hue: number; muted?: boolean }> = {
  new:         { label: 'Nový',      hue: 26 },
  in_progress: { label: 'V řešení',  hue: 70 },
  resolved:    { label: 'Vyřešeno',  hue: 150 },
  dismissed:   { label: 'Zamítnuto', hue: 0, muted: true },
}

export const CAT_ORDER: CategoryId[]  = ['bug', 'feature', 'design', 'ux', 'text']
export const STATUS_ORDER: StatusId[] = ['new', 'in_progress', 'resolved', 'dismissed']

/* ── CatBadge ── */
export function CatBadge({ cat, size = 'md' }: { cat: string; size?: 'sm' | 'md' }) {
  const c = CATEGORIES[cat as CategoryId]
  if (!c) return <span className="badge badge-other">{cat}</span>
  const small = size === 'sm'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: small ? 4 : 5,
        padding: small ? '2px 8px' : '4px 10px 4px 8px',
        borderRadius: 7,
        fontSize: small ? 11 : 12,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        color: `oklch(0.84 0.12 ${c.hue})`,
        background: `oklch(0.7 0.12 ${c.hue} / 0.14)`,
        border: `1px solid oklch(0.7 0.12 ${c.hue} / 0.26)`,
      }}
    >
      {!small && <Icon name={CAT_ICON[cat]} size={13} />}
      {c.label}
    </span>
  )
}

/* ── StatusPill ── */
export function StatusPill({ status, dot = true }: { status: string; dot?: boolean }) {
  const s = STATUSES[status as StatusId]
  if (!s) return <span className="status-badge">{status}</span>
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        color: s.muted ? 'var(--text-3)' : `oklch(0.86 0.11 ${s.hue})`,
        background: s.muted ? 'var(--surface-2)' : `oklch(0.7 0.12 ${s.hue} / 0.12)`,
        border: s.muted
          ? '1px solid var(--border)'
          : `1px solid oklch(0.7 0.12 ${s.hue} / 0.22)`,
      }}
    >
      {dot && (
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: s.muted ? 'var(--text-3)' : `oklch(0.7 0.16 ${s.hue})`,
          flexShrink: 0,
        }} />
      )}
      {s.label}
    </span>
  )
}

/* ── Avatar ── */
export function Avatar({ email, size = 30 }: { email: string | null; size?: number }) {
  const str = email || '?'
  const initial = str[0].toUpperCase()
  let n = 0
  for (const ch of str) n += ch.charCodeAt(0)
  const hue = n % 360
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%',
      display: 'grid', placeItems: 'center',
      flexShrink: 0,
      fontSize: size * 0.4, fontWeight: 700, color: '#fff',
      background: `linear-gradient(150deg, oklch(0.68 0.13 ${hue}), oklch(0.58 0.15 ${hue}))`,
    }}>
      {initial}
    </span>
  )
}

/* ── Date helpers ── */
export function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const dt = new Date(iso)
  const dd = String(dt.getDate()).padStart(2, '0')
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const hh = String(dt.getHours()).padStart(2, '0')
  const mi = String(dt.getMinutes()).padStart(2, '0')
  return `${dd}. ${mm}. ${dt.getFullYear()} · ${hh}:${mi}`
}

export function timeAgo(iso: string | null): string {
  if (!iso) return '—'
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  const m = Math.floor(diff / 60)
  const h = Math.floor(diff / 3600)
  const d = Math.floor(diff / 86400)
  if (m < 1)  return 'právě teď'
  if (m < 60) return `před ${m} min`
  if (h < 24) return `před ${h} h`
  if (d === 1) return 'včera'
  if (d < 30)  return `před ${d} dny`
  return fmtDate(iso)
}

/* ── Title helper — odvodi z comment ── */
export function deriveTitle(comment: string | null): string {
  if (!comment) return 'Bez komentáře'
  const firstLine = comment.split('\n')[0].trim()
  return firstLine.length > 60 ? firstLine.slice(0, 60) + '…' : firstLine
}
