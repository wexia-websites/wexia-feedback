'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useFeedback } from '@/lib/feedback-context'
import type { Note } from '@/lib/feedback-context'
import { useCheckEmails } from '@/lib/useCheckEmails'
import {
  Icon, CatBadge, StatusPill, Avatar,
  CATEGORIES, STATUSES, STATUS_ORDER, STATUS_ICON,
  fmtDate, timeAgo, deriveTitle, stripEmailQuote,
  type CategoryId, type StatusId,
} from '@/lib/feedback-ui'

function ElementPreview({ selector, html }: { selector: string | null; html: string | null }) {
  const [copied, setCopied] = useState(false)
  const [renderError, setRenderError] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const hasSelector = !!selector?.trim()
  const hasHtml = !!html?.trim()

  const srcdoc = hasHtml ? `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; }
  body { margin: 20px; background: #1a1a1a; display: flex; align-items: center; justify-content: center; min-height: calc(100vh - 40px); font-family: system-ui, sans-serif; }
  body > * { outline: 2px solid #e02020; outline-offset: 4px; border-radius: 4px; max-width: 100%; }
  button, input, select, textarea { background: #2a2a2a; color: #fff; border: 1px solid #444; padding: 6px 12px; border-radius: 6px; font-size: 14px; }
  a { color: #e02020; } p, span, div, label, h1, h2, h3, h4 { color: #fff; }
  img { max-width: 200px; max-height: 120px; object-fit: contain; }
</style></head><body>${html}</body></html>` : ''

  function copyHtml() {
    if (!hasHtml) return
    navigator.clipboard.writeText(html!).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="detail-section">Označený prvek</div>
      {!hasSelector && !hasHtml && (
        <div style={{ color: 'var(--text-3)', fontSize: 13, fontStyle: 'italic' }}>Uživatel neoznačil žádný prvek</div>
      )}
      {hasSelector && (
        <div style={{ marginBottom: 14 }}>
          <code style={{ display: 'inline-block', background: 'var(--accent-soft)', border: '1px solid var(--accent-line)', borderRadius: 6, padding: '4px 10px', color: 'var(--accent-hi)', fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>
            {selector}
          </code>
        </div>
      )}
      {hasHtml && (
        <>
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-2)', borderRadius: '8px 8px 0 0', padding: '6px 12px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-3)', fontSize: 11, fontFamily: 'monospace' }}>HTML</span>
              <button onClick={copyHtml} className={copied ? 'btn btn-success' : 'btn btn-ghost'} style={{ fontSize: 11, padding: '3px 8px' }}>
                {copied ? '✓ Zkopírováno' : 'Kopírovat'}
              </button>
            </div>
            <pre style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: 14, maxHeight: 150, overflowY: 'auto', overflowX: 'auto', margin: 0 }}>
              <code style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{html}</code>
            </pre>
          </div>
          {!renderError && (
            <div>
              <div style={{ color: 'var(--text-3)', fontSize: 11, marginBottom: 6 }}>Náhled prvku</div>
              <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: '#1a1a1a' }}>
                <iframe ref={iframeRef} srcDoc={srcdoc} sandbox="allow-same-origin"
                  style={{ width: '100%', height: 120, border: 'none', display: 'block' }}
                  onError={() => setRenderError(true)} title="Element preview" />
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
  const searchParams = useSearchParams()
  const id = params.id as string

  const { reports, loading, updateStatus, addNote, refresh } = useFeedback()

  const [updating, setUpdating] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [noteDraft, setNoteDraft] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [replyDraft, setReplyDraft] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [replyResult, setReplyResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const { checkEmails: handleCheckEmails, checkingEmails, checkResult } = useCheckEmails()
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState<'status' | 'emails' | 'notes'>(
    tabParam === 'emails' ? 'emails' : tabParam === 'notes' ? 'notes' : 'status'
  )

  // Report z kontextu — žádný vlastní fetch
  const item = reports.find(r => r.id === id) ?? null

  // Prev / next: reports jsou řazené timestamp desc (nejnovější první)
  const idx    = reports.findIndex(r => r.id === id)
  const prevId = idx > 0 ? reports[idx - 1].id : null
  const nextId = idx >= 0 && idx < reports.length - 1 ? reports[idx + 1].id : null

  async function handleUpdateStatus(newStatus: string) {
    setUpdating(true)
    await updateStatus(id, newStatus)
    setSuccessMsg(`Status: ${STATUSES[newStatus as StatusId]?.label ?? newStatus}`)
    setTimeout(() => setSuccessMsg(''), 3000)
    setUpdating(false)
  }

  async function handleSendReply() {
    if (!replyDraft.trim()) return
    setSendingReply(true)
    setReplyResult(null)
    try {
      const res = await fetch('/api/send-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackId: id, replyText: replyDraft.trim() }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setReplyResult({ ok: false, msg: json.error ?? 'Chyba při odesílání.' })
      } else {
        const sentAt = new Date().toISOString()
        setReplyResult({ ok: true, msg: `Odesláno ${new Date(sentAt).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}` })
        const note: Note = {
          author: 'Tým',
          at: sentAt,
          text: `📧 Odpověď uživateli: ${replyDraft.trim()}`,
        }
        await addNote(id, note)
        setReplyDraft('')
      }
    } catch {
      setReplyResult({ ok: false, msg: 'Síťová chyba. Zkus to znovu.' })
    }
    setSendingReply(false)
  }

  // Auto-polling každých 30 s když je aktivní záložka E-maily
  useEffect(() => {
    if (activeTab !== 'emails') return
    const timer = setInterval(() => { handleCheckEmails() }, 30_000)
    return () => clearInterval(timer)
  }, [activeTab]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAddNote() {
    if (!noteDraft.trim()) return
    setAddingNote(true)
    const note: Note = { author: 'Tým', at: new Date().toISOString(), text: noteDraft.trim() }
    await addNote(id, note)
    setNoteDraft('')
    setAddingNote(false)
  }

  if (loading) return <div className="empty" style={{ marginTop: 80 }}><span>Načítám...</span></div>

  if (!item) return (
    <div className="empty" style={{ marginTop: 80 }}>
      <span>Feedback nenalezen.</span>
      <Link href="/dashboard" className="btn btn-outline" style={{ marginTop: 8 }}>← Zpět</Link>
    </div>
  )

  const screenshotSrc = item.screenshot_url
    ? item.screenshot_url
    : item.screenshot
      ? `data:${item.screenshot_mime || 'image/png'};base64,${item.screenshot}`
      : null

  const title = deriveTitle(item.comment)
  const SENT_PREFIX = '📧 Odpověď uživateli: '
  const RECV_PREFIX = '📨 Odpověď od uživatele:\n'
  const allNotes: Note[] = item.notes ?? []
  const emailNotes = allNotes.filter(n => n.text.startsWith(SENT_PREFIX) || n.text.startsWith(RECV_PREFIX))
  const notes      = allNotes.filter(n => !n.text.startsWith(SENT_PREFIX) && !n.text.startsWith(RECV_PREFIX))

  return (
    <>
      {/* Detail bar */}
      <div style={{ padding: '18px 32px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => router.back()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 700, color: 'var(--text-2)', padding: '8px 12px 8px 8px', borderRadius: 9, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.14s, color 0.14s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-2)' }}>
          <Icon name="arrowLeft" size={16} /> Zpět na reporty
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 4 }}>
          <button disabled={!prevId} onClick={() => prevId && router.push(`/dashboard/${prevId}`)} title="Novější"
            style={{ width: 28, height: 28, borderRadius: 7, display: 'grid', placeItems: 'center', color: prevId ? 'var(--text-2)' : 'var(--border-2)', background: 'none', border: 'none', cursor: prevId ? 'pointer' : 'not-allowed' }}
            onMouseEnter={e => { if (prevId) e.currentTarget.style.background = 'var(--surface-2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
            <Icon name="chevronDown" size={16} style={{ transform: 'rotate(90deg)' }} />
          </button>
          <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-2)', padding: '0 8px', fontWeight: 500, whiteSpace: 'nowrap' }}>
            {item.id.slice(0, 8)}
          </span>
          <button disabled={!nextId} onClick={() => nextId && router.push(`/dashboard/${nextId}`)} title="Starší"
            style={{ width: 28, height: 28, borderRadius: 7, display: 'grid', placeItems: 'center', color: nextId ? 'var(--text-2)' : 'var(--border-2)', background: 'none', border: 'none', cursor: nextId ? 'pointer' : 'not-allowed' }}
            onMouseEnter={e => { if (nextId) e.currentTarget.style.background = 'var(--surface-2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
            <Icon name="chevronDown" size={16} style={{ transform: 'rotate(-90deg)' }} />
          </button>
        </div>
      </div>

      {/* Detail grid */}
      <div style={{ padding: '20px 32px 60px', display: 'grid', gridTemplateColumns: '1fr 332px', gap: 20, alignItems: 'start' }}>

        {/* ── Main column ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <CatBadge cat={item.category || 'other'} />
            <StatusPill status={item.status || 'new'} />
          </div>
          <h1 style={{ fontSize: 25, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: 20, color: 'var(--text)' }}>{title}</h1>

          {/* Screenshot */}
          <div style={{ marginBottom: 20 }}>
            {screenshotSrc ? (
              <>
                <img src={screenshotSrc} alt="Screenshot" title="Otevřít v plné velikosti"
                  onClick={() => window.open(screenshotSrc, '_blank')}
                  style={{ width: '100%', display: 'block', borderRadius: 14, boxShadow: 'var(--shadow)', cursor: 'pointer', aspectRatio: '16/9', objectFit: 'cover', objectPosition: 'top' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-3)', marginTop: 11, fontWeight: 500 }}>
                  <Icon name="pin" size={13} style={{ color: 'var(--accent-hi)' }} />
                  Uživatelem označené místo na stránce
                  <span style={{ fontFamily: 'monospace', color: 'var(--text-2)' }}>{item.url || '—'}</span>
                </div>
              </>
            ) : (
              <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <Icon name="monitor" size={20} style={{ color: 'var(--text-3)' }} />
                <span style={{ color: 'var(--text-3)', fontSize: 13, fontStyle: 'italic' }}>Screenshot není k dispozici</span>
              </div>
            )}
          </div>

          {/* Komentář */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 11 }}>
              <Icon name="comment" size={15} style={{ color: 'var(--accent-hi)' }} />Komentář uživatele
            </div>
            <p style={{ fontSize: 15.5, lineHeight: 1.62, color: 'var(--text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {item.comment || <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>Bez komentáře</span>}
            </p>
          </div>

          {/* Meta grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 26px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '8px 20px', marginBottom: 20 }}>
            {[
              { icon: 'mail',     label: 'E-mail',    value: item.user_email || '—', mono: true,  link: undefined },
              { icon: 'globe',    label: 'Stránka',   value: item.url || '—',        mono: true,  link: item.url ?? undefined },
              { icon: 'monitor',  label: 'Prohlížeč', value: item.user_agent || '—', mono: false, link: undefined },
              { icon: 'calendar', label: 'Přijato',   value: fmtDate(item.timestamp), mono: false, link: undefined },
              { icon: 'layers',   label: 'Zdroj',     value: item.source_app || 'AI Laboratoř', mono: false, link: undefined },
            ].map((m, i, arr) => (
              <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderBottom: i < arr.length - 2 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ width: 32, height: 32, borderRadius: 9, display: 'grid', placeItems: 'center', background: 'var(--surface-2)', color: 'var(--text-2)', flexShrink: 0 }}>
                  <Icon name={m.icon} size={15} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label}</div>
                  {m.link ? (
                    <a href={m.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13.5, fontWeight: 600, marginTop: 2, display: 'block', color: 'var(--accent-hi)', fontFamily: m.mono ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>{m.value}</a>
                  ) : (
                    <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 2, color: 'var(--text)', fontFamily: m.mono ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>{m.value}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <ElementPreview selector={item.element_selector} html={item.element_html} />
        </div>

        {/* ── Side column ── */}
        <aside style={{ position: 'sticky', top: 20 }}>

          {/* Tab bar */}
          <div style={{
            display: 'flex', gap: 2,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 4, marginBottom: 12, boxShadow: 'var(--shadow)',
          }}>
            {([
              { id: 'status', label: 'Stav' },
              { id: 'emails', label: 'E-maily' },
              { id: 'notes',  label: 'Poznámky' },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1, padding: '7px 10px', borderRadius: 9,
                  fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                  border: 'none', cursor: 'pointer', transition: 'background 0.14s, color 0.14s',
                  background: activeTab === tab.id ? 'var(--accent)' : 'none',
                  color: activeTab === tab.id ? '#fff' : 'var(--text-2)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB: Stav */}
          {activeTab === 'status' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Změnit stav */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, boxShadow: 'var(--shadow)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 13 }}>Změnit stav</div>
                {successMsg && <div className="success-banner" style={{ marginBottom: 10 }}>✓ {successMsg}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {STATUS_ORDER.map(s => {
                    const st = STATUSES[s]
                    const isOn = (item.status || 'new') === s
                    return (
                      <button key={s} onClick={() => handleUpdateStatus(s)} disabled={updating || isOn}
                        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 11px', borderRadius: 10, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: isOn ? 'default' : 'pointer', color: isOn ? (st.muted ? 'var(--text)' : `oklch(0.86 0.11 ${st.hue})`) : 'var(--text-2)', background: isOn ? (st.muted ? 'var(--surface-hi)' : `oklch(0.7 0.13 ${st.hue} / 0.14)`) : 'var(--surface-2)', border: isOn ? (st.muted ? '1px solid var(--border-2)' : `1px solid oklch(0.7 0.13 ${st.hue} / 0.4)`) : '1px solid transparent', transition: 'all 0.14s', opacity: updating ? 0.6 : 1 }}
                        onMouseEnter={e => { if (!isOn) e.currentTarget.style.background = 'var(--surface-hi)' }}
                        onMouseLeave={e => { if (!isOn) e.currentTarget.style.background = 'var(--surface-2)' }}>
                        <Icon name={STATUS_ICON[s]} size={15} />
                        {st.label}
                        {isOn && <Icon name="check" size={14} style={{ marginLeft: 'auto' }} />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Vlastnosti */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, boxShadow: 'var(--shadow)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 13 }}>Vlastnosti</div>
                <div style={{ borderBottom: '1px solid var(--border)', padding: '9px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>Kategorie</span>
                  <CatBadge cat={item.category || 'other'} size="sm" />
                </div>
                {item.source_app && (
                  <div style={{ borderBottom: '1px solid var(--border)', padding: '9px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>Zdroj</span>
                    <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>{item.source_app}</span>
                  </div>
                )}
                <div style={{ padding: '9px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>ID reportu</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-2)' }}>{item.id.slice(0, 8)}</span>
                </div>
              </div>

            </div>
          )}

          {/* TAB: E-maily */}
          {activeTab === 'emails' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Hlavička + tlačítko zkontrolovat */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Konverzace</div>
                <button
                  onClick={handleCheckEmails}
                  disabled={checkingEmails}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--accent-hi)', background: 'none', border: 'none', cursor: checkingEmails ? 'default' : 'pointer', fontFamily: 'inherit', opacity: checkingEmails ? 0.5 : 1, padding: '2px 4px', borderRadius: 6 }}
                  onMouseEnter={e => { if (!checkingEmails) e.currentTarget.style.background = 'var(--accent-soft)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                >
                  <Icon name="trend" size={13} />
                  {checkingEmails ? 'Načítám…' : 'Zkontrolovat'}
                </button>
              </div>

              {checkResult && (
                <div style={{ fontSize: 12, color: checkResult.startsWith('Chyba') ? 'var(--accent-hi)' : 'var(--text-3)', fontStyle: 'italic' }}>
                  {checkResult}
                </div>
              )}

              {/* Chat bubliny — chronologicky */}
              {emailNotes.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-3)', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
                  Zatím žádná komunikace.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[...emailNotes]
                    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
                    .map((n, i) => {
                      const isSent = n.text.startsWith(SENT_PREFIX)
                      const rawText = isSent ? n.text.slice(SENT_PREFIX.length) : n.text.slice(RECV_PREFIX.length)
                      const text = isSent ? rawText : stripEmailQuote(rawText)
                      return (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isSent ? 'flex-end' : 'flex-start' }}>
                          {/* Label */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: 11.5, color: 'var(--text-3)', fontWeight: 600 }}>
                            {!isSent && item.user_email && <Avatar email={item.user_email} size={16} />}
                            <span>{isSent ? 'Wexia Feedback' : (item.user_email ?? 'Uživatel')}</span>
                          </div>
                          {/* Bublina */}
                          <div style={{
                            maxWidth: '88%',
                            background: isSent ? 'var(--accent-soft)' : 'var(--surface-2)',
                            border: isSent ? '1px solid var(--accent-line)' : '1px solid var(--border)',
                            borderRadius: isSent ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                            padding: '10px 13px',
                          }}>
                            <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--text)', whiteSpace: 'pre-wrap', margin: 0, wordBreak: 'break-word' }}>{text}</p>
                          </div>
                          {/* Čas */}
                          <span style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3, fontWeight: 500 }}>{timeAgo(n.at)}</span>
                        </div>
                      )
                    })}
                </div>
              )}

              {/* Odpovědět uživateli */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, boxShadow: 'var(--shadow)', marginTop: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 13 }}>Odpovědět</div>
                {item.user_email ? (
                  <>
                    {replyResult && (
                      <div className={replyResult.ok ? 'success-banner' : 'error-banner'} style={{ marginBottom: 10 }}>
                        {replyResult.ok ? `✓ ${replyResult.msg}` : `✕ ${replyResult.msg}`}
                      </div>
                    )}
                    <textarea
                      value={replyDraft}
                      onChange={e => { setReplyDraft(e.target.value); setReplyResult(null) }}
                      placeholder="Napiš odpověď uživateli…"
                      style={{ width: '100%', minHeight: 80, resize: 'vertical', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 11, padding: '11px 13px', color: 'var(--text)', fontFamily: 'inherit', fontSize: 13.5, lineHeight: 1.5, outline: 'none', transition: 'border-color 0.14s, box-shadow 0.14s' }}
                      onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent-line)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-soft)' }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
                    />
                    <button onClick={handleSendReply} disabled={!replyDraft.trim() || sendingReply}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', marginTop: 9, padding: 11, borderRadius: 10, fontSize: 13.5, fontWeight: 700, color: '#fff', background: 'var(--accent)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.14s, opacity 0.14s', opacity: !replyDraft.trim() || sendingReply ? 0.45 : 1 }}
                      onMouseEnter={e => { if (replyDraft.trim() && !sendingReply) e.currentTarget.style.background = 'var(--accent-hi)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)' }}>
                      <Icon name="mail" size={15} />
                      {sendingReply ? 'Odesílám…' : 'Odeslat e-mail'}
                    </button>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--text-3)', fontStyle: 'italic' }}>Feedback neobsahuje e-mail uživatele.</div>
                )}
              </div>

            </div>
          )}

          {/* TAB: Poznámky */}
          {activeTab === 'notes' && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, boxShadow: 'var(--shadow)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 13 }}>Interní poznámky</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: notes.length > 0 ? 13 : 0 }}>
                {notes.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-3)', fontStyle: 'italic', paddingBottom: 4 }}>Zatím žádné poznámky.</div>}
                {notes.map((n, i) => (
                  <div key={i} style={{ background: 'var(--surface-2)', borderRadius: 11, padding: '11px 13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 6 }}>
                      <Avatar email={n.author} size={20} />
                      <strong style={{ fontWeight: 700 }}>{n.author}</strong>
                      <span style={{ color: 'var(--text-3)', marginLeft: 'auto', fontWeight: 500 }}>{timeAgo(n.at)}</span>
                    </div>
                    <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-2)' }}>{n.text}</p>
                  </div>
                ))}
              </div>
              <div>
                <textarea value={noteDraft} onChange={e => setNoteDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddNote() }}
                  placeholder="Přidat poznámku… (Ctrl+Enter)"
                  style={{ width: '100%', minHeight: 64, resize: 'vertical', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 11, padding: '11px 13px', color: 'var(--text)', fontFamily: 'inherit', fontSize: 13.5, lineHeight: 1.5, outline: 'none', transition: 'border-color 0.14s, box-shadow 0.14s' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent-line)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-soft)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }} />
                <button onClick={handleAddNote} disabled={!noteDraft.trim() || addingNote}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', marginTop: 9, padding: 11, borderRadius: 10, fontSize: 13.5, fontWeight: 700, color: '#fff', background: 'var(--accent)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.14s, opacity 0.14s', opacity: !noteDraft.trim() || addingNote ? 0.45 : 1 }}
                  onMouseEnter={e => { if (noteDraft.trim()) e.currentTarget.style.background = 'var(--accent-hi)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)' }}>
                  <Icon name="plus" size={15} />
                  {addingNote ? 'Ukládám…' : 'Přidat poznámku'}
                </button>
              </div>
            </div>
          )}

        </aside>
      </div>
    </>
  )
}
