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

function formatDate(ts: string | null) {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
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
  body { margin: 20px; background: #1a1a1a; display: flex; align-items: center; justify-content: center; min-height: calc(100vh - 40px); font-family: system-ui, sans-serif; }
  body > * { outline: 2px solid #e02020; outline-offset: 4px; border-radius: 4px; max-width: 100%; }
  button, input, select, textarea { background: #2a2a2a; color: #fff; border: 1px solid #444; padding: 6px 12px; border-radius: 6px; font-size: 14px; }
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
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="detail-section">Označený prvek</div>

      {!hasSelector && !hasHtml && (
        <div style={{ color: 'var(--text3)', fontSize: 13, fontStyle: 'italic' }}>
          Uživatel neoznačil žádný prvek
        </div>
      )}

      {hasSelector && (
        <div style={{ marginBottom: 14 }}>
          <code style={{
            display: 'inline-block',
            background: 'var(--accent-bg)',
            border: '1px solid var(--accent-border)',
            borderRadius: 6,
            padding: '4px 10px',
            color: 'var(--accent)',
            fontFamily: 'monospace',
            fontSize: 12,
            wordBreak: 'break-all',
          }}>
            {selector}
          </code>
        </div>
      )}

      {hasHtml && (
        <>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg2)',
              borderRadius: '8px 8px 0 0',
              padding: '6px 12px',
              borderBottom: '1px solid var(--border)',
            }}>
              <span style={{ color: 'var(--text3)', fontSize: 11, fontFamily: 'monospace' }}>HTML</span>
              <button
                onClick={copyHtml}
                className={copied ? 'btn btn-success btn-xs' : 'btn btn-ghost btn-xs'}
                style={{ fontSize: 11 }}
              >
                {copied ? '✓ Zkopírováno' : 'Kopírovat'}
              </button>
            </div>
            <pre style={{
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
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
                color: 'var(--text2)',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {html}
              </code>
            </pre>
          </div>

          {!renderError && (
            <div>
              <div style={{ color: 'var(--text3)', fontSize: 11, marginBottom: 6 }}>Náhled prvku</div>
              <div style={{
                border: '1px solid var(--border)',
                borderRadius: 8,
                overflow: 'hidden',
                background: '#1a1a1a',
              }}>
                <iframe
                  ref={iframeRef}
                  srcDoc={srcdoc}
                  sandbox="allow-same-origin"
                  style={{ width: '100%', height: 120, border: 'none', display: 'block' }}
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

export default function FeedbackDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [item, setItem] = useState<Feedback | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (sessionStorage.getItem('feedback_auth') !== 'true') {
      router.replace('/login')
      return
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
      <div className="empty" style={{ marginTop: 100 }}>
        <span>Načítám...</span>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="empty" style={{ marginTop: 100 }}>
        <span>Feedback nenalezen.</span>
        <Link href="/dashboard" className="btn btn-outline" style={{ marginTop: 8 }}>
          ← Zpět na přehled
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="page-header">
        <div>
          <Link href="/dashboard" className="btn btn-ghost" style={{ padding: '4px 0', marginBottom: 8, display: 'inline-flex' }}>
            ← Zpět na přehled
          </Link>
          <h1>Detail feedbacku</h1>
          <p>{formatDate(item.timestamp)}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span className={`badge badge-${item.category || 'other'}`}>
            {CATEGORY_LABELS[item.category || ''] || item.category || 'Ostatní'}
          </span>
          <span className={`status-badge status-${item.status || 'new'}`}>
            {STATUS_LABELS[item.status || 'new'] || item.status || 'Nový'}
          </span>
        </div>
      </div>

      <div className="page-body" style={{ maxWidth: 860 }}>

        {/* Info karta */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="detail-section">Informace o odesílateli</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 12, fontSize: 13 }}>
              <span style={{ color: 'var(--text3)', minWidth: 60 }}>Email</span>
              <span style={{ color: 'var(--text)' }}>{item.user_email || '—'}</span>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 13 }}>
              <span style={{ color: 'var(--text3)', minWidth: 60 }}>URL</span>
              {item.url ? (
                <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', wordBreak: 'break-all' }}>
                  {item.url}
                </a>
              ) : <span style={{ color: 'var(--text3)' }}>—</span>}
            </div>
            {item.user_agent && (
              <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                <span style={{ color: 'var(--text3)', minWidth: 60 }}>Prohlížeč</span>
                <span style={{ color: 'var(--text2)', wordBreak: 'break-all' }}>{item.user_agent}</span>
              </div>
            )}
          </div>
        </div>

        {/* Screenshot */}
        <div className="card" style={{ marginBottom: 16, padding: screenshotSrc ? 0 : 20, overflow: 'hidden' }}>
          {screenshotSrc ? (
            <img
              src={screenshotSrc}
              alt="Screenshot"
              title="Otevřít v plné velikosti"
              onClick={() => window.open(screenshotSrc, '_blank')}
              style={{ width: '100%', display: 'block', borderRadius: 'var(--r)', cursor: 'pointer' }}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: 'var(--text3)', fontSize: 18 }}>◌</span>
              <span style={{ color: 'var(--text3)', fontSize: 13, fontStyle: 'italic' }}>Screenshot není k dispozici</span>
            </div>
          )}
        </div>

        {/* Komentář */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="detail-section">Komentář</div>
          <div style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {item.comment || <span style={{ color: 'var(--text3)', fontStyle: 'italic' }}>Bez komentáře</span>}
          </div>
        </div>

        {/* Označený prvek */}
        <ElementPreview selector={item.element_selector} html={item.element_html} />

        {/* Správa statusu */}
        <div className="card">
          <div className="detail-section">Správa statusu</div>

          {successMsg && (
            <div className="success-banner">✓ {successMsg}</div>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className={`btn ${item.status === 'in_progress' ? 'btn-warn' : 'btn-outline'}`}
              onClick={() => updateStatus('in_progress')}
              disabled={updating || item.status === 'in_progress'}
            >
              ↺ Vzít do řešení
            </button>
            <button
              className={`btn ${item.status === 'resolved' ? 'btn-success' : 'btn-outline'}`}
              onClick={() => updateStatus('resolved')}
              disabled={updating || item.status === 'resolved'}
            >
              ✓ Vyřešeno
            </button>
            <button
              className={`btn ${item.status === 'dismissed' ? 'btn-danger' : 'btn-outline'}`}
              onClick={() => updateStatus('dismissed')}
              disabled={updating || item.status === 'dismissed'}
            >
              ⊟ Zamítnout
            </button>
            <button
              className={`btn ${item.status === 'new' || !item.status ? 'btn-danger' : 'btn-outline'}`}
              onClick={() => updateStatus('new')}
              disabled={updating || item.status === 'new' || !item.status}
            >
              ↩ Vrátit jako nový
            </button>
          </div>
        </div>

      </div>
    </>
  )
}
