'use client'

import { useState, useEffect } from 'react'
import { useFeedback } from '@/lib/feedback-context'
import type { Note } from '@/lib/feedback-context'
import { useCheckEmails } from '@/lib/useCheckEmails'
import { Icon, CatBadge, Avatar, timeAgo, stripEmailQuote } from '@/lib/feedback-ui'

const SENT_PREFIX = '📧 Odpověď uživateli: '
const RECV_PREFIX = '📨 Odpověď od uživatele:\n'

type Props = { reportId: string }

export default function EmailConversation({ reportId }: Props) {
  const { reports, addNote } = useFeedback()
  const { checkEmails, checkingEmails, checkResult } = useCheckEmails()

  const [replyDraft, setReplyDraft] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [replyResult, setReplyResult] = useState<{ ok: boolean; msg: string } | null>(null)

  // Auto-polling každých 30 s
  useEffect(() => {
    const timer = setInterval(() => { checkEmails() }, 30_000)
    return () => clearInterval(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const item = reports.find(r => r.id === reportId) ?? null
  if (!item) return null

  const allNotes: Note[] = item.notes ?? []
  const emailNotes = allNotes
    .filter(n => n.text.startsWith(SENT_PREFIX) || n.text.startsWith(RECV_PREFIX))
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())

  async function handleSendReply() {
    if (!replyDraft.trim()) return
    setSendingReply(true)
    setReplyResult(null)
    try {
      const res = await fetch('/api/send-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackId: reportId, replyText: replyDraft.trim() }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setReplyResult({ ok: false, msg: json.error ?? 'Chyba při odesílání.' })
      } else {
        const sentAt = new Date().toISOString()
        setReplyResult({ ok: true, msg: `Odesláno ${new Date(sentAt).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}` })
        const note: Note = { author: 'Tým', at: sentAt, text: `${SENT_PREFIX}${replyDraft.trim()}` }
        await addNote(reportId, note)
        setReplyDraft('')
      }
    } catch {
      setReplyResult({ ok: false, msg: 'Síťová chyba. Zkus to znovu.' })
    }
    setSendingReply(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <CatBadge cat={item.category || 'other'} size="sm" />
            <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.comment?.split('\n')[0]?.slice(0, 60) || 'Bez komentáře'}
            </span>
          </div>
          {item.user_email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Avatar email={item.user_email} size={18} />
              <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>{item.user_email}</span>
            </div>
          )}
        </div>
        <button
          onClick={checkEmails}
          disabled={checkingEmails}
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--accent-hi)', background: 'none', border: 'none', cursor: checkingEmails ? 'default' : 'pointer', fontFamily: 'inherit', opacity: checkingEmails ? 0.5 : 1, padding: '4px 6px', borderRadius: 6, flexShrink: 0 }}
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

      {/* Chat bubliny */}
      {emailNotes.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--text-3)', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>
          Zatím žádná komunikace.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {emailNotes.map((n, i) => {
            const isSent = n.text.startsWith(SENT_PREFIX)
            const rawText = isSent ? n.text.slice(SENT_PREFIX.length) : n.text.slice(RECV_PREFIX.length)
            const text = isSent ? rawText : stripEmailQuote(rawText)
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isSent ? 'flex-end' : 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: 11.5, color: 'var(--text-3)', fontWeight: 600 }}>
                  {!isSent && item.user_email && <Avatar email={item.user_email} size={16} />}
                  <span>{isSent ? 'Wexia Feedback' : (item.user_email ?? 'Uživatel')}</span>
                </div>
                <div style={{
                  maxWidth: '88%',
                  background: isSent ? 'var(--accent-soft)' : 'var(--surface-2)',
                  border: isSent ? '1px solid var(--accent-line)' : '1px solid var(--border)',
                  borderRadius: isSent ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  padding: '10px 13px',
                }}>
                  <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--text)', whiteSpace: 'pre-wrap', margin: 0, wordBreak: 'break-word' }}>{text}</p>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3, fontWeight: 500 }}>{timeAgo(n.at)}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Formulář Odpovědět */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 14, marginTop: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Odpovědět</div>
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
              style={{ width: '100%', minHeight: 72, resize: 'vertical', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--text)', fontFamily: 'inherit', fontSize: 13.5, lineHeight: 1.5, outline: 'none', transition: 'border-color 0.14s, box-shadow 0.14s' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent-line)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-soft)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
            />
            <button
              onClick={handleSendReply}
              disabled={!replyDraft.trim() || sendingReply}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', marginTop: 8, padding: 10, borderRadius: 10, fontSize: 13.5, fontWeight: 700, color: '#fff', background: 'var(--accent)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.14s, opacity 0.14s', opacity: !replyDraft.trim() || sendingReply ? 0.45 : 1 }}
              onMouseEnter={e => { if (replyDraft.trim() && !sendingReply) e.currentTarget.style.background = 'var(--accent-hi)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)' }}
            >
              <Icon name="mail" size={15} />
              {sendingReply ? 'Odesílám…' : 'Odeslat e-mail'}
            </button>
          </>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text-3)', fontStyle: 'italic' }}>Feedback neobsahuje e-mail uživatele.</div>
        )}
      </div>

    </div>
  )
}
