'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFeedback } from '@/lib/feedback-context'
import { useCheckEmails } from '@/lib/useCheckEmails'
import { Icon, CatBadge, Avatar, timeAgo, deriveTitle, stripEmailQuote } from '@/lib/feedback-ui'
import Dropdown from '@/components/Dropdown'
import EmailConversation from '@/components/EmailConversation'

const SENT_PREFIX = '📧 Odpověď uživateli: '
const RECV_PREFIX = '📨 Odpověď od uživatele:\n'

type Conversation = {
  reportId: string
  reportTitle: string
  reportEmail: string | null
  category: string | null
  count: number
  lastType: 'sent' | 'received'
  lastText: string
  lastAt: string
  awaitingReply: boolean
}

type ConvFilter = 'all' | 'awaiting'

export default function EmailsPage() {
  const router = useRouter()
  const { reports, loading } = useFeedback()
  const { checkEmails, checkingEmails, checkResult } = useCheckEmails()

  const [convFilter, setConvFilter] = useState<ConvFilter>('all')
  const [userFilter, setUserFilter] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Auto-polling každých 30 s
  useEffect(() => {
    const timer = setInterval(() => { checkEmails() }, 30_000)
    return () => clearInterval(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const conversations = useMemo<Conversation[]>(() => {
    const map = new Map<string, Conversation>()
    for (const r of reports) {
      const emailNotes = (r.notes ?? []).filter(n =>
        n.text.startsWith(SENT_PREFIX) || n.text.startsWith(RECV_PREFIX)
      )
      if (emailNotes.length === 0) continue
      const sorted = [...emailNotes].sort((a, b) =>
        new Date(a.at).getTime() - new Date(b.at).getTime()
      )
      const last = sorted[sorted.length - 1]
      const isSent = last.text.startsWith(SENT_PREFIX)
      const rawText = isSent ? last.text.slice(SENT_PREFIX.length) : stripEmailQuote(last.text.slice(RECV_PREFIX.length))
      map.set(r.id, {
        reportId: r.id,
        reportTitle: deriveTitle(r.comment),
        reportEmail: r.user_email,
        category: r.category,
        count: emailNotes.length,
        lastType: isSent ? 'sent' : 'received',
        lastText: rawText,
        lastAt: last.at,
        awaitingReply: !isSent,
      })
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.awaitingReply !== b.awaitingReply) return a.awaitingReply ? -1 : 1
      return new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
    })
  }, [reports])

  const userEmails = useMemo(() => {
    const seen = new Set<string>()
    conversations.forEach(c => { if (c.reportEmail) seen.add(c.reportEmail) })
    return Array.from(seen).sort()
  }, [conversations])

  const filtered = useMemo(() => {
    let list = conversations
    if (convFilter === 'awaiting') list = list.filter(c => c.awaitingReply)
    if (userFilter) list = list.filter(c => c.reportEmail === userFilter)
    return list
  }, [conversations, convFilter, userFilter])

  // Auto-select první konverzaci pokud není nic vybráno
  const effectiveSelected = selectedId && filtered.some(c => c.reportId === selectedId)
    ? selectedId
    : filtered[0]?.reportId ?? null

  const awaitingCount = conversations.filter(c => c.awaitingReply).length

  if (loading) return <div className="empty" style={{ marginTop: 80 }}><span>Načítám...</span></div>

  const chips: Array<{ id: ConvFilter; label: string; count: number }> = [
    { id: 'all',      label: 'Vše',             count: conversations.length },
    { id: 'awaiting', label: 'Čeká na odpověď', count: awaitingCount },
  ]

  return (
    <>
      {/* Horní lišta */}
      <div className="page-header">
        <div><h1>E-maily</h1><p>Konverzace s uživateli přes všechny feedbacky</p></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)', padding: '7px 13px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>
            <Icon name="mail" size={15} style={{ color: 'var(--text-3)' }} />
            {filtered.length} konverzací
          </div>
          <button
            onClick={checkEmails}
            disabled={checkingEmails}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: 'var(--accent-hi)', background: 'var(--accent-soft)', border: '1px solid var(--accent-line)', cursor: checkingEmails ? 'default' : 'pointer', fontFamily: 'inherit', opacity: checkingEmails ? 0.6 : 1 }}
          >
            <Icon name="trend" size={14} />
            {checkingEmails ? 'Načítám…' : 'Zkontrolovat'}
          </button>
        </div>
      </div>
      {checkResult && (
        <div style={{ padding: '0 32px 8px', fontSize: 12, color: checkResult.startsWith('Chyba') ? 'var(--accent-hi)' : 'var(--text-3)', fontStyle: 'italic' }}>
          {checkResult}
        </div>
      )}

      {/* Inbox — dvousloupcový layout */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* LEVÝ PANEL */}
        <div style={{ width: 360, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Filtry */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {chips.map(chip => {
                const active = convFilter === chip.id
                return (
                  <button key={chip.id} onClick={() => setConvFilter(chip.id)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, color: active ? 'var(--bg)' : 'var(--text-2)', background: active ? 'var(--text)' : 'var(--surface)', border: `1px solid ${active ? 'var(--text)' : 'var(--border)'}`, transition: 'all 0.14s', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {chip.id === 'awaiting' && !active && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-hi)', flexShrink: 0 }} />}
                    {chip.label}
                    <span style={{ fontSize: 11, opacity: active ? 0.6 : 1 }}>{chip.count}</span>
                  </button>
                )
              })}
            </div>
            <Dropdown
              value={userFilter}
              onChange={setUserFilter}
              prefixIcon="mail"
              minWidth={200}
              searchable
              searchPlaceholder="Hledat uživatele..."
              options={[
                { value: '', label: 'Všichni' },
                ...userEmails.map(email => ({
                  value: email, label: email,
                  renderItem: (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <Avatar email={email} size={18} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</span>
                    </span>
                  ),
                })),
              ]}
            />
          </div>

          {/* Seznam konverzací */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div className="empty" style={{ padding: '40px 20px' }}>
                <Icon name="mail" size={24} />
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-2)' }}>
                  {conversations.length === 0 ? 'Zatím žádná komunikace.' : 'Nic neodpovídá filtru.'}
                </div>
                {conversations.length > 0 && (
                  <button className="btn btn-outline" style={{ marginTop: 8, fontSize: 12 }}
                    onClick={() => { setConvFilter('all'); setUserFilter('') }}>
                    Zrušit filtry
                  </button>
                )}
              </div>
            ) : filtered.map(c => {
              const isSelected = c.reportId === effectiveSelected
              const isSent = c.lastType === 'sent'
              const snippet = c.lastText.replace(/\n/g, ' ')
              return (
                <button
                  key={c.reportId}
                  onClick={() => setSelectedId(c.reportId)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%',
                    padding: '12px 14px', textAlign: 'left', fontFamily: 'inherit',
                    background: isSelected ? 'var(--accent-soft)' : 'none',
                    borderLeft: isSelected ? '3px solid var(--accent)' : '3px solid transparent',
                    borderRight: 'none', borderTop: 'none',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer', transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--surface-2)' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'none' }}
                >
                  {/* Awaiting dot + Avatar */}
                  <div style={{ position: 'relative', flexShrink: 0, paddingTop: 1 }}>
                    {c.awaitingReply && (
                      <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--bg-2)', zIndex: 1 }} />
                    )}
                    <Avatar email={c.reportEmail} size={28} />
                  </div>

                  {/* Obsah */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: c.awaitingReply ? 700 : 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.reportTitle}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {timeAgo(c.lastAt)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                      <CatBadge cat={c.category || 'other'} size="sm" />
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                        {c.count} {c.count === 1 ? 'zpráva' : c.count < 5 ? 'zprávy' : 'zpráv'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 11.5, flexShrink: 0 }}>{isSent ? '📧' : '📨'}</span>
                      <span style={{ fontSize: 12, color: isSent ? 'var(--text-3)' : (c.awaitingReply ? 'var(--text)' : 'var(--text-3)'), fontWeight: c.awaitingReply ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {isSent ? `Vy: ${snippet}` : snippet}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* PRAVÝ PANEL */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {effectiveSelected ? (
            <div style={{ padding: '20px 24px', flex: 1 }}>
              {/* Link na celý feedback */}
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => router.push(`/dashboard/${effectiveSelected}`)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, color: 'var(--accent-hi)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 8px', borderRadius: 7 }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-soft)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  Otevřít celý feedback <Icon name="arrowUpRight" size={13} />
                </button>
              </div>
              <EmailConversation reportId={effectiveSelected} />
            </div>
          ) : (
            <div className="empty" style={{ margin: 'auto' }}>
              <Icon name="mail" size={28} />
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-2)' }}>Zatím žádná e-mailová komunikace.</div>
              <p>E-maily se zde zobrazí, jakmile odešleš první odpověď.</p>
            </div>
          )}
        </div>

      </div>
    </>
  )
}
