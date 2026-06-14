'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useFeedback } from '@/lib/feedback-context'
import { Icon, CATEGORIES, STATUSES, CAT_ORDER, STATUS_ORDER, CAT_ICON, STATUS_ICON } from '@/lib/feedback-ui'

function NavItem({
  icon, label, count, active, hue, onClick,
}: {
  icon: string
  label: string
  count?: number
  active: boolean
  hue?: number | null
  onClick: () => void
}) {
  const hasHue = hue != null
  return (
    <button
      className={'nav-link' + (active ? ' active' : '')}
      style={hasHue ? ({ '--h': hue } as React.CSSProperties) : undefined}
      onClick={onClick}
    >
      <span className="nav-icon"><Icon name={icon} size={18} /></span>
      <span style={{ flex: 1 }}>{label}</span>
      {count != null && count > 0 && <span className="nav-count">{count}</span>}
    </button>
  )
}

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { reports } = useFeedback()

  const [open, setOpen] = useState(true)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const stored = localStorage.getItem('sidebar_open')
    if (stored === 'false') setOpen(false)
    const t = localStorage.getItem('theme') as 'dark' | 'light' | null
    if (t === 'light' || t === 'dark') setTheme(t)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  // Counts odvozené z kontextových dat
  const countStatus = (s: string) => reports.filter(r => (r.status || 'new') === s).length
  const countCat    = (c: string) => reports.filter(r => r.category === c).length

  function toggleSidebar(val: boolean) {
    setOpen(val)
    localStorage.setItem('sidebar_open', String(val))
  }

  function logout() {
    sessionStorage.removeItem('feedback_auth')
    router.push('/login')
  }

  function navTo(params: Record<string, string>) {
    const sp = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v) sp.set(k, v) })
    const q = sp.toString()
    router.push(`/dashboard${q ? '?' + q : ''}`)
  }

  const isDashboard  = pathname === '/dashboard'
  const curStatus    = isDashboard ? (searchParams.get('status') ?? '') : ''
  const curCategory  = isDashboard ? (searchParams.get('category') ?? '') : ''

  const isStatusActive   = (id: string) => isDashboard && curStatus === id && curCategory === ''
  const isCategoryActive = (id: string) => isDashboard && curCategory === id && curStatus === ''
  const isDashboardHome  = isDashboard && curStatus === '' && curCategory === ''

  return (
    <>
      {open ? (
        <button
          onClick={() => toggleSidebar(false)}
          title="Skrýt sidebar"
          style={{
            position: 'fixed', top: '50%', left: 246, transform: 'translateY(-50%)',
            zIndex: 60, background: 'transparent', border: 'none',
            color: 'var(--text-3)', fontSize: 24, cursor: 'pointer',
            lineHeight: 1, padding: '4px 2px', transition: 'color 0.12s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
        >‹</button>
      ) : (
        <div className="sidebar-strip" onClick={() => toggleSidebar(true)} title="Zobrazit sidebar">
          <div className="sidebar-strip-arrow">›</div>
        </div>
      )}

      <nav className={`sidebar${open ? '' : ' closed'}`}>
        <div className="sidebar-logo" onClick={() => navTo({})} style={{ cursor: 'pointer' }}>
          <div className="sidebar-logo-mark">w</div>
          <div className="sidebar-logo-text">
            <strong>Feedback</strong>
            <span>Wexia Digital</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 4 }}>
          <NavItem icon="dashboard" label="Přehled" active={isDashboardHome} onClick={() => navTo({})} />

          <div className="nav-section-heading">Stav</div>
          {STATUS_ORDER.map(s => (
            <NavItem
              key={s}
              icon={STATUS_ICON[s]}
              label={STATUSES[s].label}
              count={countStatus(s)}
              hue={STATUSES[s].muted ? null : STATUSES[s].hue}
              active={isStatusActive(s)}
              onClick={() => navTo({ status: s })}
            />
          ))}

          <div className="nav-section-heading">Kategorie</div>
          {CAT_ORDER.map(c => (
            <NavItem
              key={c}
              icon={CAT_ICON[c]}
              label={CATEGORIES[c].label}
              count={countCat(c)}
              hue={CATEGORIES[c].hue}
              active={isCategoryActive(c)}
              onClick={() => navTo({ category: c })}
            />
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button className="nav-link" style={{ color: 'var(--text-3)', fontWeight: 500 }}
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
            <span className="nav-icon"><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} /></span>
            <span style={{ flex: 1 }}>{theme === 'dark' ? 'Světlý režim' : 'Tmavý režim'}</span>
          </button>
          <button className="nav-link" style={{ color: 'var(--text-3)', fontWeight: 500 }}
            onClick={logout}>
            <span className="nav-icon"><Icon name="logout" size={18} /></span>
            <span style={{ flex: 1 }}>Odhlásit</span>
          </button>
        </div>
      </nav>
    </>
  )
}
