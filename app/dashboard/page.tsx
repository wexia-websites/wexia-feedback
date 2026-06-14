'use client'

import { useState, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useFeedback } from '@/lib/feedback-context'
import {
  Icon, CatBadge, StatusPill, Avatar,
  CATEGORIES, STATUSES, CAT_ORDER, STATUS_ORDER, CAT_ICON, STATUS_ICON,
  fmtDate, timeAgo, deriveTitle,
  type CategoryId, type StatusId,
} from '@/lib/feedback-ui'
import type { FeedbackItem } from '@/lib/feedback-context'

/* ── Thumb ── */
function Thumb({ item, rounded = 8 }: { item: FeedbackItem; rounded?: number }) {
  const src = item.screenshot_url
    ? item.screenshot_url
    : item.screenshot
      ? `data:${item.screenshot_mime || 'image/png'};base64,${item.screenshot}`
      : null

  if (src) {
    return (
      <div style={{ width: '100%', height: '100%', borderRadius: rounded, overflow: 'hidden', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
      </div>
    )
  }
  const cat = (item.category || 'bug') as CategoryId
  const hue = CATEGORIES[cat]?.hue ?? 40
  return (
    <div style={{ width: '100%', height: '100%', borderRadius: rounded, background: `oklch(0.7 0.12 ${hue} / 0.10)`, border: `1px solid oklch(0.7 0.12 ${hue} / 0.22)`, display: 'grid', placeItems: 'center' }}>
      <Icon name={CAT_ICON[cat] || 'flag'} size={22} style={{ color: `oklch(0.74 0.13 ${hue})`, opacity: 0.5 }} />
    </div>
  )
}

/* ── TrendChart ── */
function TrendChart({ items }: { items: FeedbackItem[] }) {
  const days = useMemo(() => {
    const result: number[] = Array(14).fill(0)
    const now = Date.now()
    items.forEach(item => {
      if (!item.timestamp) return
      const diff = Math.floor((now - new Date(item.timestamp).getTime()) / 86400000)
      if (diff >= 0 && diff < 14) result[13 - diff]++
    })
    return result
  }, [items])

  const max = Math.max(...days, 1)
  const total = days.reduce((a, b) => a + b, 0)

  return (
    <div className="card" style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>Příchozí reporty</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2, fontWeight: 500 }}>Posledních 14 dní</div>
        </div>
        <div style={{ textAlign: 'right', lineHeight: 1 }}>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em' }}>{total}</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginTop: 3 }}>celkem</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7, height: 100 }}>
        {days.map((v, i) => (
          <div key={i} style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end' }} title={`${v} reportů`}>
            <div style={{
              width: '100%', minHeight: 4, borderRadius: '6px 6px 3px 3px',
              background: 'linear-gradient(180deg, var(--accent-hi), var(--accent))',
              height: `${(v / max) * 100}%`,
              opacity: i === 13 ? 1 : 0.5,
            }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>
        <span>−14 d</span><span>dnes</span>
      </div>
    </div>
  )
}

/* ── CategoryBreakdown ── */
function CategoryBreakdown({ items, onFilter }: { items: FeedbackItem[]; onFilter: (cat: string) => void }) {
  const counts = useMemo(() => CAT_ORDER.map(c => ({ c, n: items.filter(i => i.category === c).length })), [items])
  const max = Math.max(...counts.map(x => x.n), 1)
  return (
    <div className="card" style={{ padding: '20px 22px' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>Podle kategorie</div>
        <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2, fontWeight: 500 }}>Rozdělení všech reportů</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {counts.map(({ c, n }) => {
          const hue = CATEGORIES[c as CategoryId].hue
          return (
            <button key={c} onClick={() => onFilter(c)}
              style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '7px 8px', borderRadius: 9, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', width: '100%', fontFamily: 'inherit', transition: 'background 0.14s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <span style={{ width: 26, height: 26, borderRadius: 7, display: 'grid', placeItems: 'center', background: `oklch(0.7 0.12 ${hue} / 0.14)`, color: `oklch(0.74 0.13 ${hue})`, flexShrink: 0 }}>
                <Icon name={CAT_ICON[c]} size={15} />
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, width: 64, flexShrink: 0, color: 'var(--text)' }}>{CATEGORIES[c as CategoryId].label}</span>
              <span style={{ flex: 1, height: 8, background: 'var(--surface-2)', borderRadius: 6, overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', borderRadius: 6, background: `oklch(0.68 0.15 ${hue})`, width: `${(n / max) * 100}%` }} />
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', width: 24, textAlign: 'right' }}>{n}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── ListRow ── */
function ListRow({ item, onClick }: { item: FeedbackItem; onClick: () => void }) {
  const title   = deriveTitle(item.comment)
  const snippet = item.comment && item.comment.length > 150 ? item.comment.slice(0, 150) + '…' : (item.comment || '')
  return (
    <button className="list-row" onClick={onClick}
      style={{ display: 'flex', alignItems: 'stretch', gap: 16, textAlign: 'left', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 14, boxShadow: 'var(--shadow)', width: '100%', fontFamily: 'inherit', cursor: 'pointer', transition: 'transform 0.15s, border-color 0.15s, box-shadow 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--border-2)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'var(--shadow)' }}
    >
      <div style={{ width: 132, flexShrink: 0 }}><Thumb item={item} rounded={9} /></div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <CatBadge cat={item.category || 'other'} />
          <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 500, whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{item.id.slice(0, 8)}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'var(--text-2)', marginLeft: 'auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
            <Icon name="globe" size={12} style={{ color: 'var(--text-3)', flexShrink: 0 }} />{item.url || '—'}
          </span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text)' }}>{title}</div>
        {snippet && (
          <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{snippet}</div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-3)', marginTop: 'auto' }}>
          <Avatar email={item.user_email} size={20} />
          <span style={{ fontWeight: 500, color: 'var(--text-2)' }}>{item.user_email || '—'}</span>
          <span>·</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Icon name="calendar" size={12} style={{ color: 'var(--text-3)' }} />{fmtDate(item.timestamp)}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', flexShrink: 0, padding: '2px 0' }}>
        <StatusPill status={item.status || 'new'} />
        <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 600 }}>{timeAgo(item.timestamp)}</span>
        <Icon name="chevronRight" size={18} style={{ color: 'var(--text-3)' }} />
      </div>
    </button>
  )
}

/* ── Main content ── */
function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { reports, loading } = useFeedback()

  const urlStatus   = searchParams.get('status') ?? ''
  const urlCategory = searchParams.get('category') ?? ''
  const isListView  = urlStatus !== '' || urlCategory !== ''

  const [q, setQ]       = useState('')
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')
  const [statusF, setStatusF] = useState(urlStatus)

  // Sync status chip with URL
  const prevUrlStatus = urlStatus
  if (statusF !== prevUrlStatus && !q) setStatusF(urlStatus)

  const countStatus = (s: string) => reports.filter(r => (r.status || 'new') === s).length

  function navTo(params: Record<string, string>) {
    const sp = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v) sp.set(k, v) })
    router.push(`/dashboard${sp.toString() ? '?' + sp.toString() : ''}`)
  }

  const base = useMemo(() => {
    let list = reports
    if (urlCategory) list = list.filter(i => i.category === urlCategory)
    return list
  }, [reports, urlCategory])

  const filtered = useMemo(() => {
    let list = base
    if (statusF) list = list.filter(i => (i.status || 'new') === statusF)
    if (q.trim()) {
      const t = q.toLowerCase()
      list = list.filter(i =>
        (i.comment || '').toLowerCase().includes(t) ||
        (i.user_email || '').toLowerCase().includes(t) ||
        (i.url || '').toLowerCase().includes(t)
      )
    }
    return [...list].sort((a, b) => {
      const ta = new Date(a.timestamp || 0).getTime()
      const tb = new Date(b.timestamp || 0).getTime()
      return sort === 'newest' ? tb - ta : ta - tb
    })
  }, [base, statusF, q, sort])

  let heading = 'Všechny reporty', sub = 'Kompletní zpětná vazba'
  if (urlStatus && STATUSES[urlStatus as StatusId]) {
    heading = STATUSES[urlStatus as StatusId].label
    sub = `Reporty se stavem „${STATUSES[urlStatus as StatusId].label.toLowerCase()}"`
  }
  if (urlCategory && CATEGORIES[urlCategory as CategoryId]) {
    heading = CATEGORIES[urlCategory as CategoryId].label
    sub = CATEGORIES[urlCategory as CategoryId].desc
  }

  if (loading) return <div className="empty" style={{ marginTop: 80 }}><span>Načítám...</span></div>

  /* ── DASHBOARD VIEW ── */
  if (!isListView) return (
    <>
      <div className="page-header">
        <div>
          <h1>Přehled</h1>
          <p>Zpětná vazba z AI Laboratoře — co přišlo a kde to vázne.</p>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)', padding: '7px 13px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>
          <Icon name="layers" size={15} style={{ color: 'var(--text-3)' }} />
          {reports.length} reportů
        </div>
      </div>
      <div className="page-body">
        <div className="stat-grid">
          {STATUS_ORDER.map(s => {
            const st = STATUSES[s]
            return (
              <button key={s} onClick={() => navTo({ status: s })} className="stat-card"
                style={st.muted ? {} : ({ '--h': st.hue } as React.CSSProperties)}>
                <div className="stat-top">
                  <span className="stat-label">{st.label}</span>
                  <span style={{ width: 30, height: 30, borderRadius: 9, display: 'grid', placeItems: 'center', background: st.muted ? 'var(--surface-2)' : `oklch(0.7 0.12 ${st.hue} / 0.14)`, color: st.muted ? 'var(--text-3)' : `oklch(0.74 0.13 ${st.hue})` }}>
                    <Icon name={STATUS_ICON[s]} size={16} />
                  </span>
                </div>
                <div className="stat-value">{countStatus(s)}</div>
                <div className="stat-sub">{s === 'new' ? 'čeká na zpracování' : s === 'in_progress' ? 'právě opravujeme' : s === 'resolved' ? 'hotovo' : 'nebudeme řešit'}</div>
              </button>
            )
          })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 16, marginBottom: 18 }}>
          <TrendChart items={reports} />
          <CategoryBreakdown items={reports} onFilter={cat => navTo({ category: cat })} />
        </div>
        <div className="card" style={{ padding: '20px 22px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>Nejnovější reporty</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2, fontWeight: 500 }}>Poslední příchozí zpětná vazba</div>
            </div>
            <button onClick={() => navTo({})} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--accent-hi)', fontSize: 13, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 2px' }}>
              Zobrazit vše <Icon name="arrowUpRight" size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[...reports].slice(0, 5).map(item => {
              const cat = (item.category || 'bug') as CategoryId
              const hue = CATEGORIES[cat]?.hue ?? 40
              return (
                <button key={item.id} onClick={() => router.push(`/dashboard/${item.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 8px', borderRadius: 10, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%', borderBottom: '1px solid var(--border)', transition: 'background 0.14s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <span style={{ width: 32, height: 32, borderRadius: 9, display: 'grid', placeItems: 'center', background: `oklch(0.7 0.12 ${hue} / 0.14)`, color: `oklch(0.74 0.13 ${hue})`, flexShrink: 0 }}>
                    <Icon name={CAT_ICON[cat] || 'flag'} size={15} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text)' }}>{deriveTitle(item.comment)}</span>
                    <span style={{ display: 'block', fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                      <span style={{ fontFamily: 'monospace', color: 'var(--text-2)' }}>{item.url || '—'}</span> · {timeAgo(item.timestamp)}
                    </span>
                  </span>
                  <StatusPill status={item.status || 'new'} />
                  <Icon name="chevronRight" size={16} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )

  /* ── LIST VIEW ── */
  const statusChips: Array<StatusId | 'all'> = ['all', ...STATUS_ORDER]
  return (
    <>
      <div className="page-header">
        <div><h1>{heading}</h1><p>{sub}</p></div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)', padding: '7px 13px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>
          <Icon name="layers" size={15} style={{ color: 'var(--text-3)' }} />{filtered.length} z {base.length}
        </div>
      </div>
      <div className="page-body">
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 11, padding: '0 14px' }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent-line)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-soft)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}>
            <Icon name="search" size={17} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Hledat v komentáři, e-mailu nebo URL…"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 14, fontWeight: 500, padding: '12px 0', fontFamily: 'inherit' }} />
            {q && <button onClick={() => setQ('')} style={{ color: 'var(--text-3)', display: 'grid', placeItems: 'center', padding: 4, borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="x" size={14} /></button>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 11, padding: '0 12px', position: 'relative' }}>
            <Icon name="trend" size={15} style={{ color: 'var(--text-3)' }} />
            <select value={sort} onChange={e => setSort(e.target.value as 'newest' | 'oldest')}
              style={{ appearance: 'none', background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, padding: '12px 22px 12px 0', cursor: 'pointer' }}>
              <option value="newest">Nejnovější</option>
              <option value="oldest">Nejstarší</option>
            </select>
            <Icon name="chevronDown" size={14} style={{ color: 'var(--text-3)', position: 'absolute', right: 11, pointerEvents: 'none' }} />
          </div>
        </div>

        {!urlStatus && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
            {statusChips.map(s => {
              const active = (s === 'all' && !statusF) || statusF === s
              const st = s !== 'all' ? STATUSES[s as StatusId] : null
              const hue = st && !st.muted ? st.hue : null
              return (
                <button key={s} onClick={() => setStatusF(s === 'all' ? '' : s)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 13px', borderRadius: 20, fontSize: 13, fontWeight: 700, color: active ? 'var(--bg)' : 'var(--text-2)', background: active ? 'var(--text)' : 'var(--surface)', border: `1px solid ${active ? 'var(--text)' : 'var(--border)'}`, transition: 'all 0.14s', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {hue != null && <span style={{ width: 7, height: 7, borderRadius: '50%', background: `oklch(0.7 0.16 ${hue})`, flexShrink: 0 }} />}
                  {s === 'all' ? 'Vše' : STATUSES[s as StatusId].label}
                  <span style={{ fontSize: 11.5, opacity: active ? 0.6 : 1 }}>
                    {s === 'all' ? base.length : base.filter(i => (i.status || 'new') === s).length}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {filtered.length === 0 ? (
            <div className="empty">
              <Icon name="inbox" size={28} />
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-2)' }}>Nic tu není</div>
              <p>Zkus změnit filtr nebo hledaný výraz.</p>
            </div>
          ) : filtered.map(item => (
            <ListRow key={item.id} item={item} onClick={() => router.push(`/dashboard/${item.id}`)} />
          ))}
        </div>
      </div>
    </>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="empty" style={{ marginTop: 80 }}><span>Načítám...</span></div>}>
      <DashboardContent />
    </Suspense>
  )
}
