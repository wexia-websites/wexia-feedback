'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFeedback } from '@/lib/feedback-context'
import { useCheckEmails } from '@/lib/useCheckEmails'
import { Icon, CatBadge, Avatar, timeAgo, deriveTitle, stripEmailQuote } from '@/lib/feedback-ui'
import Dropdown from '@/components/Dropdown'

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

  const [convFilter, setConvFilter] = useState<ConvFilter>('all')
  const [userFilter, setUserFilter] = useState('')
  const { checkEmails, checkingEmails, checkResult } = useCheckEmails()

  // Auto-polling každých 30 s dokud je stránka zobrazená
  useEffect(() => {
    const timer = setInterval(() => { checkEmails() }, 30_000)
    return () => clearInterval(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Skupinová logika — jedna konverzace per report
  const conversations = useMemo<Conversation[]>(() => {
    const map = new Map<string, Conversation>()

    for (const r of reports) {
      const emailNotes = (r.notes ?? []).filter(n =>
        n.text.startsWith(SENT_PREFIX) || n.text.startsWith(RECV_PREFIX)
      )
      if (emailNotes.length === 0) continue

      // Seřaď chronologicky pro správné určení poslední zprávy
      const sorted = [...emailNotes].sort((a, b) =>
        new Date(a.at).getTime() - new Date(b.at).getTime()
      )
      const last = sorted[sorted.length - 1]
      const isSent = last.text.startsWith(SENT_PREFIX)
      const rawText = isSent
        ? last.text.slice(SENT_PREFIX.length)
        : stripEmailQuote(last.text.slice(RECV_PREFIX.length))

      map.set(r.id, {
        reportId: r.id,
        reportTitle: deriveTitle(r.comment),
        reportEmail: r.user_email,
        category: r.category,
        count: emailNotes.length,
        lastType: isSent ? 'sent' : 'received',
        lastText: rawText,
        lastAt: last.at,
        awaitingReply: !isSent, // poslední zpráva je od uživatele
      })
    }

    // Řazení: awaiting první, pak ostatní — každá skupina podle lastAt desc
    return Array.from(map.values()).sort((a, b) => {
      if (a.awaitingReply !== b.awaitingReply) return a.awaitingReply ? -1 : 1
      return new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
    })
  }, [reports])

  // Distinct emails z konverzací
  const userEmails = useMemo(() => {
    const seen = new Set<string>()
    conversations.forEach(c => { if (c.reportEmail) seen.add(c.reportEmail) })
    return Array.from(seen).sort()
  }, [conversations])

  // AND filtrování
  const filtered = useMemo(() => {
    let list = conversations
    if (convFilter === 'awaiting') list = list.filter(c => c.awaitingReply)
    if (userFilter) list = list.filter(c => c.reportEmail === userFilter)
    return list
  }, [conversations, convFilter, userFilter])

  const awaitingCount = conversations.filter(c => c.awaitingReply).length

  if (loading) return (
    <div className="empty" style={{ marginTop: 80 }}><span>Načítám...</span></div>
  )

  const chips: Array<{ id: ConvFilter; label: string; count: number }> = [
    { id: 'all',      label: 'Vše',               count: conversations.length },
    { id: 'awaiting', label: 'Čeká na odpověď',   count: awaitingCount },
  ]

  return (
    <>
      <div className="page-header">
        <div>
          <h1>E-maily</h1>
          <p>Konverzace s uživateli přes všechny feedbacky</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'var(--surface)', border: '1px solid var(--border)',
            color: 'var(--text-2)', padding: '7px 13px', borderRadius: 10, fontSize: 13, fontWeight: 700,
          }}>
            <Icon name="mail" size={15} style={{ color: 'var(--text-3)' }} />
            {filtered.length} konverzací
          </div>
          <button
            onClick={checkEmails}
            disabled={checkingEmails}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: 'var(--accent-hi)', background: 'var(--accent-soft)', border: '1px solid var(--accent-line)', cursor: checkingEmails ? 'default' : 'pointer', fontFamily: 'inherit', opacity: checkingEmails ? 0.6 : 1, transition: 'opacity 0.14s' }}
          >
            <Icon name="trend" size={14} />
            {checkingEmails ? 'Načítám…' : 'Zkontrolovat'}
          </button>
        </div>
      </div>
      {checkResult && (
        <div style={{ padding: '0 32px 10px', fontSize: 12, color: checkResult.startsWith('Chyba') ? 'var(--accent-hi)' : 'var(--text-3)', fontStyle: 'italic' }}>
          {checkResult}
        </div>
      )}

      <div className="page-body">
        {/* Filtry */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {chips.map(chip => {
              const active = convFilter === chip.id
              const isAwaiting = chip.id === 'awaiting'
              return (
                <button
                  key={chip.id}
                  onClick={() => setConvFilter(chip.id)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '7px 13px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                    color: active ? 'var(--bg)' : 'var(--text-2)',
                    background: active ? 'var(--text)' : 'var(--surface)',
                    border: `1px solid ${active ? 'var(--text)' : 'var(--border)'}`,
                    transition: 'all 0.14s', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {isAwaiting && !active && (
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-hi)', flexShrink: 0 }} />
                  )}
                  {chip.label}
                  <span style={{ fontSize: 11.5, opacity: active ? 0.6 : 1 }}>{chip.count}</span>
                </button>
              )
            })}
          </div>

          <Dropdown
            value={userFilter}
            onChange={setUserFilter}
            prefixIcon="mail"
            minWidth={160}
            searchable
            searchPlaceholder="Hledat uživatele..."
            options={[
              { value: '', label: 'Všichni' },
              ...userEmails.map(email => ({
                value: email,
                label: email,
                renderItem: (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <Avatar email={email} size={20} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</span>
                  </span>
                ),
              })),
            ]}
          />
        </div>

        {/* Seznam konverzací */}
        {filtered.length === 0 ? (
          <div className="empty">
            <Icon name="mail" size={28} />
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-2)' }}>
              {conversations.length === 0
                ? 'Zatím žádná e-mailová komunikace.'
                : 'Žádné konverzace neodpovídají filtru.'}
            </div>
            {conversations.length === 0
              ? <p>E-maily se zde zobrazí, jakmile odešleš první odpověď.</p>
              : <button className="btn btn-outline" style={{ marginTop: 12 }}
                  onClick={() => { setConvFilter('all'); setUserFilter('') }}>
                  Zrušit filtry
                </button>
            }
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(c => {
              const isSent = c.lastType === 'sent'
              const snippet = c.lastText.replace(/\n/g, ' ')
              const snippetFull = isSent ? `Vy: ${snippet}` : snippet
              return (
                <button
                  key={c.reportId}
                  onClick={() => router.push(`/dashboard/${c.reportId}?tab=emails`)}
                  style={{
                    display: 'flex', alignItems: 'stretch', gap: 14, textAlign: 'left',
                    background: 'var(--surface)',
                    border: c.awaitingReply ? '1px solid var(--accent-line)' : '1px solid var(--border)',
                    borderRadius: 13, padding: '14px 16px',
                    boxShadow: 'var(--shadow)', width: '100%', fontFamily: 'inherit',
                    cursor: 'pointer', transition: 'transform 0.15s, border-color 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={ev => {
                    ev.currentTarget.style.transform = 'translateY(-1px)'
                    ev.currentTarget.style.boxShadow = 'var(--shadow-lg)'
                  }}
                  onMouseLeave={ev => {
                    ev.currentTarget.style.transform = ''
                    ev.currentTarget.style.boxShadow = 'var(--shadow)'
                  }}
                >
                  {/* Avatar */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', flexShrink: 0, paddingTop: 2 }}>
                    <Avatar email={c.reportEmail} size={38} />
                  </div>

                  {/* Obsah */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {/* Horní řádek: badge + title + čas */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CatBadge cat={c.category || 'other'} size="sm" />
                      <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.reportTitle}
                      </span>
                      <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {timeAgo(c.lastAt)}
                      </span>
                    </div>

                    {/* Email uživatele */}
                    {c.reportEmail && (
                      <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>{c.reportEmail}</span>
                    )}

                    {/* Náhled poslední zprávy */}
                    <p style={{
                      fontSize: 13, color: c.awaitingReply ? 'var(--text)' : 'var(--text-3)',
                      fontWeight: c.awaitingReply ? 600 : 400,
                      lineHeight: 1.45, margin: 0,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {snippetFull}
                    </p>
                  </div>

                  {/* Pravý sloupec: počet zpráv + awaiting badge */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', flexShrink: 0, gap: 6 }}>
                    <span style={{
                      fontSize: 11.5, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      background: 'var(--surface-2)', border: '1px solid var(--border)',
                      color: 'var(--text-3)', whiteSpace: 'nowrap',
                    }}>
                      {c.count} {c.count === 1 ? 'zpráva' : c.count < 5 ? 'zprávy' : 'zpráv'}
                    </span>
                    {c.awaitingReply && (
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                        background: 'var(--accent-soft)', border: '1px solid var(--accent-line)',
                        color: 'var(--accent-hi)', whiteSpace: 'nowrap',
                      }}>
                        Čeká na odpověď
                      </span>
                    )}
                    {!c.awaitingReply && <Icon name="chevronRight" size={16} style={{ color: 'var(--text-3)' }} />}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
