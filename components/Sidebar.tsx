'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Counts = {
  total: number
  new: number
  in_progress: number
  resolved: number
  dismissed: number
  bug: number
  feature: number
  design: number
  ux: number
  text: number
}

const EMPTY_COUNTS: Counts = {
  total: 0, new: 0, in_progress: 0, resolved: 0, dismissed: 0,
  bug: 0, feature: 0, design: 0, ux: 0, text: 0,
}

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [counts, setCounts] = useState<Counts>(EMPTY_COUNTS)

  useEffect(() => {
    const stored = localStorage.getItem('sidebar_open')
    if (stored === 'false') setSidebarOpen(false)
    const t = localStorage.getItem('theme') as 'dark' | 'light' | null
    if (t === 'light' || t === 'dark') setTheme(t)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    loadCounts()
  }, [])

  async function loadCounts() {
    const { data } = await supabase.from('feedback').select('status, category')
    if (!data) return
    const c: Counts = { ...EMPTY_COUNTS, total: data.length }
    data.forEach(row => {
      const s = (row.status || 'new') as keyof Counts
      if (s in c) c[s]++
      const cat = row.category as keyof Counts
      if (cat && cat in c) c[cat]++
    })
    setCounts(c)
  }

  function toggleSidebar(open: boolean) {
    setSidebarOpen(open)
    localStorage.setItem('sidebar_open', String(open))
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

  const isDashboard = pathname === '/dashboard'
  const currentStatus = isDashboard ? (searchParams.get('status') ?? '') : ''
  const currentCategory = isDashboard ? (searchParams.get('category') ?? '') : ''

  function isStatusActive(id: string) {
    if (!isDashboard) return false
    return currentStatus === id && currentCategory === ''
  }

  function isCategoryActive(id: string) {
    if (!isDashboard) return false
    return currentCategory === id && currentStatus === ''
  }

  const statusItems = [
    { id: '', label: 'Přehled', icon: '▤', count: counts.total },
    { id: 'new', label: 'Nové', icon: '⊹', count: counts.new },
    { id: 'in_progress', label: 'V řešení', icon: '↺', count: counts.in_progress },
    { id: 'resolved', label: 'Vyřešeno', icon: '✦', count: counts.resolved },
    { id: 'dismissed', label: 'Zamítnuto', icon: '⊟', count: counts.dismissed },
  ]

  const categoryItems = [
    { id: 'bug', label: 'Bugy', icon: '⬡', count: counts.bug },
    { id: 'feature', label: 'Featury', icon: '✓', count: counts.feature },
    { id: 'design', label: 'Design', icon: '◈', count: counts.design },
    { id: 'ux', label: 'UX', icon: '◉', count: counts.ux },
    { id: 'text', label: 'Text', icon: '◌', count: counts.text },
  ]

  return (
    <>
      {sidebarOpen ? (
        <button
          onClick={() => toggleSidebar(false)}
          title="Skrýt sidebar"
          style={{
            position: 'fixed',
            top: '50%',
            left: 208,
            transform: 'translateY(-50%)',
            zIndex: 60,
            background: 'transparent',
            border: 'none',
            color: 'var(--text3)',
            fontSize: 28,
            cursor: 'pointer',
            lineHeight: 1,
            padding: '4px 2px',
            transition: 'color 0.12s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#e02020')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}
        >
          ‹
        </button>
      ) : (
        <div
          className="sidebar-strip"
          onClick={() => toggleSidebar(true)}
          title="Zobrazit sidebar"
        >
          <div className="sidebar-strip-arrow">›</div>
        </div>
      )}

      <nav className={`sidebar${sidebarOpen ? '' : ' closed'}`}>
        {/* Logo */}
        <div
          className="sidebar-logo"
          onClick={() => navTo({})}
          style={{ cursor: 'pointer' }}
        >
          <div className="sidebar-logo-mark">✦</div>
          <div className="sidebar-logo-text">
            <strong>Feedback</strong>
            <span>AI Laboratoř</span>
          </div>
        </div>

        {/* Sekce: FEEDBACK */}
        <div className="nav-section-heading">FEEDBACK</div>
        {statusItems.map(item => (
          <button
            key={item.id}
            className={`nav-link ${isStatusActive(item.id) ? 'active' : ''}`}
            onClick={() => navTo(item.id ? { status: item.id } : {})}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
            {item.count > 0 && (
              <span className="nav-count">{item.count}</span>
            )}
          </button>
        ))}

        {/* Sekce: KATEGORIE */}
        <div className="nav-section-heading">KATEGORIE</div>
        {categoryItems.map(item => (
          <button
            key={item.id}
            className={`nav-link ${isCategoryActive(item.id) ? 'active' : ''}`}
            onClick={() => navTo({ category: item.id })}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
            {item.count > 0 && (
              <span className="nav-count">{item.count}</span>
            )}
          </button>
        ))}

        {/* Patička */}
        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
          <button
            className="nav-link"
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          >
            <span className="nav-icon">{theme === 'dark' ? '☀' : '☾'}</span>
            {theme === 'dark' ? 'Světlý režim' : 'Tmavý režim'}
          </button>
          <button
            className="nav-link"
            onClick={logout}
            style={{ color: '#e02020' }}
          >
            <span className="nav-icon">→</span>
            Odhlásit
          </button>
        </div>
      </nav>
    </>
  )
}
