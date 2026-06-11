'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
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

export default function FeedbackDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [item, setItem] = useState<Feedback | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (sessionStorage.getItem('feedback_auth') !== 'true') {
        router.replace('/login')
        return
      }
    }
    loadItem()
  }, [id])

  async function loadItem() {
    setLoading(true)
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('id', id)
      .single()
    if (!error && data) setItem(data as Feedback)
    setLoading(false)
  }

  async function updateStatus(newStatus: string) {
    if (!item) return
    setUpdating(true)
    const { error } = await supabase
      .from('feedback')
      .update({ status: newStatus })
      .eq('id', item.id)
    if (!error) {
      setItem(prev => prev ? { ...prev, status: newStatus } : prev)
      setSuccessMsg(`Status změněn na: ${STATUS_LABELS[newStatus] || newStatus}`)
      setTimeout(() => setSuccessMsg(''), 3000)
    }
    setUpdating(false)
  }

  const screenshotSrc = item?.screenshot_url
    ? item.screenshot_url
    : item?.screenshot
      ? `data:${item.screenshot_mime || 'image/png'};base64,${item.screenshot}`
      : null

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--muted)' }}>Načítám...</div>
      </div>
    )
  }

  if (!item) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--muted)' }}>Feedback nenalezen. <Link href="/dashboard" style={{ color: 'var(--accent)' }}>Zpět</Link></div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '32px 24px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* Back */}
        <Link
          href="/dashboard"
          className="btn btn-ghost"
          style={{ marginBottom: 24, display: 'inline-flex', padding: '6px 0', color: 'var(--muted)' }}
        >
          ← Zpět na dashboard
        </Link>

        {/* Header */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <span className={`badge badge-${item.category || 'other'}`}>
              {CATEGORY_LABELS[item.category || ''] || item.category || 'Ostatní'}
            </span>
            <span className={`status-badge status-${item.status || 'new'}`} style={{ fontSize: 14, padding: '5px 14px' }}>
              {STATUS_LABELS[item.status || 'new'] || item.status || 'Nový'}
            </span>
            <span style={{ color: 'var(--muted)', fontSize: 13, marginLeft: 'auto' }}>
              📅 {formatDate(item.timestamp)}
            </span>
          </div>

          {/* Email */}
          <div style={{ marginBottom: 10, color: 'var(--text)', fontSize: 15 }}>
            <span style={{ color: 'var(--muted)' }}>👤 Email: </span>
            {item.user_email || '—'}
          </div>

          {/* URL */}
          <div style={{ marginBottom: 10, fontSize: 15 }}>
            <span style={{ color: 'var(--muted)' }}>🌐 URL: </span>
            {item.url ? (
              <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                {item.url}
              </a>
            ) : '—'}
          </div>

          {/* User agent */}
          {item.user_agent && (
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
              🌐 {item.user_agent}
            </div>
          )}
        </div>

        {/* Screenshot */}
        {screenshotSrc && (
          <div className="card" style={{ marginBottom: 20, padding: 0, overflow: 'hidden' }}>
            <img
              src={screenshotSrc}
              alt="Screenshot"
              style={{ width: '100%', display: 'block', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}
            />
          </div>
        )}

        {/* Comment */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 10 }}>💬 Komentář</div>
          <div style={{ fontSize: 17, lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {item.comment || <span style={{ color: 'var(--muted)' }}>Bez komentáře</span>}
          </div>
        </div>

        {/* HTML element */}
        {item.element_html && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 10 }}>
              🖥️ HTML element
              {item.element_selector && (
                <span style={{ marginLeft: 8, color: '#3b82f6', fontFamily: 'monospace' }}>
                  {item.element_selector}
                </span>
              )}
            </div>
            <pre style={{
              background: '#0d0d0d',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 14,
              maxHeight: 200,
              overflowY: 'auto',
              overflowX: 'auto',
              margin: 0,
            }}>
              <code style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {item.element_html}
              </code>
            </pre>
          </div>
        )}

        {/* Status management */}
        <div className="card">
          <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 14 }}>🔧 Správa statusu</div>

          {successMsg && (
            <div style={{
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: 8,
              padding: '10px 14px',
              color: '#22c55e',
              fontSize: 14,
              marginBottom: 14,
            }}>
              ✅ {successMsg}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="btn btn-outline"
              onClick={() => updateStatus('in_progress')}
              disabled={updating || item.status === 'in_progress'}
              style={{ borderColor: item.status === 'in_progress' ? '#f59e0b' : undefined, color: item.status === 'in_progress' ? '#f59e0b' : undefined }}
            >
              🔄 Vzít do řešení
            </button>
            <button
              className="btn btn-outline"
              onClick={() => updateStatus('resolved')}
              disabled={updating || item.status === 'resolved'}
              style={{ borderColor: item.status === 'resolved' ? '#22c55e' : undefined, color: item.status === 'resolved' ? '#22c55e' : undefined }}
            >
              ✅ Vyřešeno
            </button>
            <button
              className="btn btn-outline"
              onClick={() => updateStatus('dismissed')}
              disabled={updating || item.status === 'dismissed'}
              style={{ borderColor: item.status === 'dismissed' ? '#6b7280' : undefined, color: item.status === 'dismissed' ? '#6b7280' : undefined }}
            >
              ❌ Zamítnout
            </button>
            <button
              className="btn btn-outline"
              onClick={() => updateStatus('new')}
              disabled={updating || item.status === 'new'}
              style={{ borderColor: item.status === 'new' ? '#ef4444' : undefined, color: item.status === 'new' ? '#ef4444' : undefined }}
            >
              ↩️ Vrátit jako nový
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
