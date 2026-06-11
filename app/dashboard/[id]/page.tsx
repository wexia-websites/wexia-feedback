'use client'

import { useEffect, useState, useRef } from 'react'
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

function ElementPreview({ selector, html }: { selector: string | null; html: string | null }) {
  const [copied, setCopied] = useState(false)
  const [renderError, setRenderError] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const hasSelector = !!selector?.trim()
  const hasHtml = !!html?.trim()

  const srcdoc = hasHtml ? `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; }
  body {
    margin: 20px;
    background: #1a1a1a;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: calc(100vh - 40px);
    font-family: system-ui, sans-serif;
  }
  body > * {
    outline: 2px solid #e02020;
    outline-offset: 4px;
    border-radius: 4px;
    max-width: 100%;
  }
  /* reset common styles so element is visible */
  button, input, select, textarea {
    background: #2a2a2a;
    color: #fff;
    border: 1px solid #444;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
  }
  a { color: #e02020; }
  p, span, div, label, h1, h2, h3, h4 { color: #fff; }
  img { max-width: 200px; max-height: 120px; object-fit: contain; }
</style>
</head>
<body>${html}</body>
</html>` : ''

  function copyHtml() {
    if (!hasHtml) return
    navigator.clipboard.writeText(html!).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{
      background: '#1a1a1a',
      border: '1px solid #2a2a2a',
      borderRadius: 8,
      padding: 16,
      marginBottom: 20,
    }}>
      {/* Title */}
      <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12, fontWeight: 600 }}>
        🎯 Označený prvek
      </div>

      {/* Fallback — nic nebylo označeno */}
      {!hasSelector && !hasHtml && (
        <div style={{ color: '#555', fontSize: 13, fontStyle: 'italic' }}>
          Uživatel neoznačil žádný prvek
        </div>
      )}

      {/* CSS Selector badge */}
      {hasSelector && (
        <div style={{ marginBottom: 14 }}>
          <code style={{
            display: 'inline-block',
            background: 'rgba(224,32,32,0.1)',
            border: '1px solid rgba(224,32,32,0.25)',
            borderRadius: 6,
            padding: '4px 10px',
            color: '#e02020',
            fontFamily: 'monospace',
            fontSize: 13,
            wordBreak: 'break-all',
          }}>
            {selector}
          </code>
        </div>
      )}

      {hasHtml && (
        <>
          {/* HTML code block with copy button */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#111',
              borderRadius: '8px 8px 0 0',
              padding: '6px 12px',
              borderBottom: '1px solid #2a2a2a',
            }}>
              <span style={{ color: '#555', fontSize: 11, fontFamily: 'monospace' }}>HTML</span>
              <button
                onClick={copyHtml}
                style={{
                  background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
                  border: '1px solid',
                  borderColor: copied ? 'rgba(34,197,94,0.3)' : '#333',
                  color: copied ? '#22c55e' : '#888',
                  borderRadius: 5,
                  padding: '3px 10px',
                  fontSize: 11,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {copied ? '✓ Zkopírováno' : 'Kopírovat'}
              </button>
            </div>
            <pre style={{
              background: '#0d0d0d',
              border: '1px solid #2a2a2a',
              borderTop: 'none',
              borderRadius: '0 0 8px 8px',
              padding: 14,
              maxHeight: 150,
              overflowY: 'auto',
              overflowX: 'auto',
              margin: 0,
            }}>
              <code style={{
                fontSize: 12,
                color: '#94a3b8',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {html}
              </code>
            </pre>
          </div>

          {/* Live render in iframe */}
          {!renderError && (
            <div>
              <div style={{ color: '#555', fontSize: 11, marginBottom: 6 }}>Náhled prvku</div>
              <div style={{
                border: '1px solid #2a2a2a',
                borderRadius: 8,
                overflow: 'hidden',
                background: '#1a1a1a',
              }}>
                <iframe
                  ref={iframeRef}
                  srcDoc={srcdoc}
                  sandbox="allow-same-origin"
                  style={{
                    width: '100%',
                    height: 120,
                    border: 'none',
                    display: 'block',
                  }}
                  onError={() => setRenderError(true)}
                  title="Element preview"
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
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

        {/* Označený prvek — vždy zobraz sekci */}
        <ElementPreview
          selector={item.element_selector}
          html={item.element_html}
        />

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
