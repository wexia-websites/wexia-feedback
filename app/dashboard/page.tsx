'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Feedback = {
  id: string
  user_id: string | null
  user_email: string | null
  category: string | null
  comment: string | null
  element_selector: string | null
  element_html: string | null
  screenshot: string | null
  screenshot_mime: string | null
  screenshot_url: string | null
  url: string | null
  user_agent: string | null
  timestamp: string | null
  status: string | null
}

const CATEGORY_LABELS: Record<string, string> = {
  bug: 'Bug',
  feature: 'Feature',
  design: 'Design',
  ux: 'UX',
  text: 'Text',
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Nový',
  in_progress: 'V řešení',
  resolved: 'Vyřešeno',
  dismissed: 'Zamítnuto',
}

function formatDate(ts: string | null) {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
}

function formatUrl(url: string | null) {
  if (!url) return '—'
  try {
    const u = new URL(url)
    return u.pathname + (u.search || '')
  } catch {
    return url
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [items, setItems] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (sessionStorage.getItem('feedback_auth') !== 'true') {
        router.replace('/login')
        return
      }
    }
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('timestamp', { ascending: false })
    if (!error && data) setItems(data as Feedback[])
    setLoading(false)
  }

  const filtered = items
    .filter(item => {
      if (filterCategory && item.category !== filterCategory) return false
      if (filterStatus && item.status !== filterStatus) return false
      if (search) {
        const q = search.toLowerCase()
        const inComment = item.comment?.toLowerCase().includes(q) ?? false
        const inEmail = item.user_email?.toLowerCase().includes(q) ?? false
        if (!inComment && !inEmail) return false
      }
      return true
    })
    .sort((a, b) => {
      const ta = new Date(a.timestamp || 0).getTime()
      const tb = new Date(b.timestamp || 0).getTime()
      return sortOrder === 'desc' ? tb - ta : ta - tb
    })

  const total = items.length
  const bugs = items.filter(i => i.category === 'bug').length
  const features = items.filter(i => i.category === 'feature').length
  const design = items.filter(i => i.category === 'design').length
  const newCount = items.filter(i => !i.status || i.status === 'new').length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '32px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)' }}>Feedback</h1>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>AI Laboratoř</p>
          </div>
          <button
            className="btn btn-outline"
            onClick={() => { sessionStorage.removeItem('feedback_auth'); router.push('/login') }}
          >
            Odhlásit
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
          <div className="stat-card">
            <div className="stat-number">{total}</div>
            <div className="stat-label">📊 Celkem</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: '#ef4444' }}>{bugs}</div>
            <div className="stat-label">🐛 Bugy</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: '#3b82f6' }}>{features}</div>
            <div className="stat-label">✨ Featury</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: '#a855f7' }}>{design}</div>
            <div className="stat-label">🎨 Design</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: '#f59e0b' }}>{newCount}</div>
            <div className="stat-label">⚡ Nové</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24, alignItems: 'center' }}>
          <input
            className="input"
            placeholder="Hledat v komentáři nebo emailu..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: '1 1 220px', minWidth: 180 }}
          />
          <select className="select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="">Všechny kategorie</option>
            <option value="bug">Bug</option>
            <option value="feature">Feature</option>
            <option value="design">Design</option>
            <option value="ux">UX</option>
            <option value="text">Text</option>
          </select>
          <select className="select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Všechny statusy</option>
            <option value="new">Nový</option>
            <option value="in_progress">V řešení</option>
            <option value="resolved">Vyřešeno</option>
            <option value="dismissed">Zamítnuto</option>
          </select>
          <select className="select" value={sortOrder} onChange={e => setSortOrder(e.target.value as 'desc' | 'asc')}>
            <option value="desc">Nejnovější</option>
            <option value="asc">Nejstarší</option>
          </select>
        </div>

        {/* Count */}
        <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>
          {loading ? 'Načítám...' : `${filtered.length} z ${total} feedbacků`}
        </div>

        {/* List */}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 60 }}>Načítám feedbacky...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 60 }}>
            Žádné feedbacky nenalezeny.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))',
            gap: 16,
          }}>
            {filtered.map(item => (
              <FeedbackCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FeedbackCard({ item }: { item: Feedback }) {
  const hasScreenshot = item.screenshot_url || item.screenshot
  const screenshotSrc = item.screenshot_url
    ? item.screenshot_url
    : item.screenshot
      ? `data:${item.screenshot_mime || 'image/png'};base64,${item.screenshot}`
      : null

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Top row: badges + date */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <span className={`badge badge-${item.category || 'other'}`}>
            {CATEGORY_LABELS[item.category || ''] || item.category || 'Ostatní'}
          </span>
          <span className={`status-badge status-${item.status || 'new'}`}>
            {STATUS_LABELS[item.status || 'new'] || item.status || 'Nový'}
          </span>
        </div>
        <span style={{ color: 'var(--muted)', fontSize: 13 }}>
          📅 {formatDate(item.timestamp)}
        </span>
      </div>

      {/* Email */}
      <div style={{ color: 'var(--muted)', fontSize: 13 }}>
        👤 {item.user_email || '—'}
      </div>

      {/* URL */}
      <div style={{ color: 'var(--muted)', fontSize: 13 }}>
        🌐 {formatUrl(item.url)}
      </div>

      {/* Comment - always full */}
      <div style={{
        color: 'var(--text)',
        fontSize: 14,
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {item.comment || <span style={{ color: 'var(--muted)' }}>Bez komentáře</span>}
      </div>

      {/* Screenshot thumbnail */}
      {hasScreenshot && screenshotSrc && (
        <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <img
            src={screenshotSrc}
            alt="Screenshot"
            style={{ width: '100%', display: 'block', maxHeight: 180, objectFit: 'cover', objectPosition: 'top' }}
          />
        </div>
      )}

      {/* Detail link */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
        <Link
          href={`/dashboard/${item.id}`}
          className="btn btn-outline"
          style={{ fontSize: 13 }}
        >
          Detail →
        </Link>
      </div>
    </div>
  )
}
