'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

function FeedbackCard({ item }: { item: Feedback }) {
  const router = useRouter()
  const screenshotSrc = item.screenshot_url
    ? item.screenshot_url
    : item.screenshot
      ? `data:${item.screenshot_mime || 'image/png'};base64,${item.screenshot}`
      : null

  return (
    <div
      className="card"
      onClick={() => router.push(`/dashboard/${item.id}`)}
      style={{ display: 'flex', flexDirection: 'column', gap: 12, cursor: 'pointer' }}
    >
      {/* Badges + datum */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span className={`badge badge-${item.category || 'other'}`}>
            {CATEGORY_LABELS[item.category || ''] || item.category || 'Ostatní'}
          </span>
          <span className={`status-badge status-${item.status || 'new'}`}>
            {STATUS_LABELS[item.status || 'new'] || item.status || 'Nový'}
          </span>
        </div>
        <span style={{ color: 'var(--text3)', fontSize: 12 }}>
          {formatDate(item.timestamp)}
        </span>
      </div>

      {/* Email */}
      <div style={{ color: 'var(--text2)', fontSize: 13 }}>
        <span style={{ color: 'var(--text3)' }}>◉ </span>
        {item.user_email || '—'}
      </div>

      {/* URL */}
      <div style={{ color: 'var(--text2)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <span style={{ color: 'var(--text3)' }}>◌ </span>
        {formatUrl(item.url)}
      </div>

      {/* Komentář — celý */}
      <div style={{
        color: 'var(--text)',
        fontSize: 13.5,
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {item.comment || <span style={{ color: 'var(--text3)', fontStyle: 'italic' }}>Bez komentáře</span>}
      </div>

      {/* Screenshot thumbnail */}
      {screenshotSrc && (
        <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <img
            src={screenshotSrc}
            alt="Screenshot"
            style={{ width: '100%', display: 'block', maxHeight: 160, objectFit: 'cover', objectPosition: 'top' }}
          />
        </div>
      )}

      {/* Detail odkaz */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
        <Link
          href={`/dashboard/${item.id}`}
          className="btn btn-outline"
          style={{ fontSize: 12 }}
          onClick={e => e.stopPropagation()}
        >
          Detail →
        </Link>
      </div>
    </div>
  )
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const urlStatus = searchParams.get('status') ?? ''
  const urlCategory = searchParams.get('category') ?? ''

  const [items, setItems] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState(urlStatus)
  const [filterCategory, setFilterCategory] = useState(urlCategory)
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  useEffect(() => {
    if (sessionStorage.getItem('feedback_auth') !== 'true') {
      router.replace('/login')
      return
    }
    loadData()
  }, [])

  useEffect(() => {
    setFilterStatus(urlStatus)
    setFilterCategory(urlCategory)
  }, [urlStatus, urlCategory])

  async function loadData() {
    setLoading(true)
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('timestamp', { ascending: false })
    if (!error && data) setItems(data as Feedback[])
    setLoading(false)
  }

  function handleStatusChange(val: string) {
    setFilterStatus(val)
    const sp = new URLSearchParams(searchParams.toString())
    if (val) { sp.set('status', val) } else { sp.delete('status') }
    router.push(`/dashboard?${sp.toString()}`)
  }

  function handleCategoryChange(val: string) {
    setFilterCategory(val)
    const sp = new URLSearchParams(searchParams.toString())
    if (val) { sp.set('category', val) } else { sp.delete('category') }
    router.push(`/dashboard?${sp.toString()}`)
  }

  const filtered = items
    .filter(item => {
      if (filterCategory && item.category !== filterCategory) return false
      if (filterStatus && item.status !== filterStatus && !(filterStatus === 'new' && !item.status)) return false
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
    <>
      <div className="page-header">
        <div>
          <h1>Feedback</h1>
          <p>Přehled zpětné vazby z AI Laboratoře</p>
        </div>
      </div>

      <div className="page-body">
        {/* Stat kartičky */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Celkem</div>
            <div className="stat-value">{total}</div>
            <div className="stat-sub">všechny záznamy</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Bugy</div>
            <div className="stat-value" style={{ color: '#ef4444' }}>{bugs}</div>
            <div className="stat-sub">nahlášené chyby</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Featury</div>
            <div className="stat-value" style={{ color: '#3b82f6' }}>{features}</div>
            <div className="stat-sub">návrhy funkcí</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Design</div>
            <div className="stat-value" style={{ color: '#a855f7' }}>{design}</div>
            <div className="stat-sub">designové podněty</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Nové</div>
            <div className="stat-value" style={{ color: '#f59e0b' }}>{newCount}</div>
            <div className="stat-sub">čeká na zpracování</div>
          </div>
        </div>

        {/* Filtry */}
        <div className="filters-row">
          <input
            className="form-input"
            placeholder="Hledat v komentáři nebo emailu..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="form-select"
            value={filterCategory}
            onChange={e => handleCategoryChange(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="">Všechny kategorie</option>
            <option value="bug">Bug</option>
            <option value="feature">Feature</option>
            <option value="design">Design</option>
            <option value="ux">UX</option>
            <option value="text">Text</option>
          </select>
          <select
            className="form-select"
            value={filterStatus}
            onChange={e => handleStatusChange(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="">Všechny statusy</option>
            <option value="new">Nový</option>
            <option value="in_progress">V řešení</option>
            <option value="resolved">Vyřešeno</option>
            <option value="dismissed">Zamítnuto</option>
          </select>
          <select
            className="form-select"
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value as 'desc' | 'asc')}
            style={{ width: 'auto' }}
          >
            <option value="desc">Nejnovější</option>
            <option value="asc">Nejstarší</option>
          </select>
        </div>

        {/* Počet výsledků */}
        <div style={{ color: 'var(--text3)', fontSize: 12, marginBottom: 16 }}>
          {loading ? 'Načítám...' : `${filtered.length} z ${total} feedbacků`}
        </div>

        {/* Seznam */}
        {loading ? (
          <div className="empty">
            <span>Načítám feedbacky...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <span style={{ fontSize: 28 }}>◌</span>
            <span>Žádné feedbacky nenalezeny</span>
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
    </>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="empty" style={{ marginTop: 100 }}>
        <span>Načítám...</span>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
