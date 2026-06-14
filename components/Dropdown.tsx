'use client'

import { useState, useEffect, useRef } from 'react'
import { Icon } from '@/lib/feedback-ui'

export type DropdownOption = {
  value: string
  label: string
  renderItem?: React.ReactNode
}

type Props = {
  value: string
  onChange: (value: string) => void
  options: DropdownOption[]
  searchable?: boolean
  searchPlaceholder?: string
  prefixIcon?: string
  minWidth?: number
}

export default function Dropdown({
  value, onChange, options,
  searchable = false,
  searchPlaceholder = 'Hledat...',
  prefixIcon,
  minWidth = 160,
}: Props) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const current = options.find(o => o.value === value)

  // Zavření klikem mimo
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQ('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Zavření Esc
  useEffect(() => {
    if (!open) return
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpen(false); setQ('') }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  // Focus input po otevření (searchable mode)
  useEffect(() => {
    if (open && searchable) {
      const t = setTimeout(() => inputRef.current?.focus(), 10)
      return () => clearTimeout(t)
    }
    if (!open) setQ('')
  }, [open, searchable])

  const filtered = searchable && q.trim()
    ? options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()))
    : options

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 11, padding: '0 12px', height: 46,
          color: 'var(--text)', fontFamily: 'inherit',
          fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
          minWidth, whiteSpace: 'nowrap',
          transition: 'border-color 0.14s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-2)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        {prefixIcon && <Icon name={prefixIcon} size={15} style={{ color: 'var(--text-3)', flexShrink: 0 }} />}
        <span style={{ flex: 1, textAlign: 'left' }}>{current?.label ?? '—'}</span>
        <Icon
          name="chevronDown" size={14}
          style={{ color: 'var(--text-3)', flexShrink: 0, transition: 'transform 0.14s', transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          minWidth: '100%', zIndex: 300,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}>
          {searchable && (
            <div style={{ padding: '8px 8px 4px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '6px 10px',
              }}>
                <Icon name="search" size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder={searchPlaceholder}
                  style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none',
                    color: 'var(--text)', fontSize: 13, fontFamily: 'inherit',
                  }}
                />
                {q && (
                  <button onClick={() => setQ('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'grid', placeItems: 'center', padding: 2 }}>
                    <Icon name="x" size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          <div style={{ maxHeight: 280, overflowY: 'auto', padding: 4 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-3)', textAlign: 'center' }}>
                Nic nenalezeno
              </div>
            ) : filtered.map(opt => {
              const isActive = opt.value === value
              return (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setOpen(false); setQ('') }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '9px 10px', borderRadius: 8, textAlign: 'left',
                    background: isActive ? 'var(--accent-soft)' : 'none',
                    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: 13.5, fontWeight: 600,
                    color: isActive ? 'var(--accent-hi)' : 'var(--text)',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface-2)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'none' }}
                >
                  <span style={{ flex: 1 }}>{opt.renderItem ?? opt.label}</span>
                  {isActive && <Icon name="check" size={14} style={{ color: 'var(--accent-hi)', flexShrink: 0 }} />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
