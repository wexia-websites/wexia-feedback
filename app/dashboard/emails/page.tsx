'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFeedback } from '@/lib/feedback-context'
import { useCheckEmails } from '@/lib/useCheckEmails'
import { Icon, CatBadge, Avatar, timeAgo, deriveTitle, stripEmailQuote } from '@/lib/feedback-ui'
import Dropdown from '@/components/Dropdown'

const SENT_PREFIX = '📧 Odpověď uživateli: '
const RECV_PREFIX = '📨 Odpověď od uživatele:\n'

type EmailEntry = {
  reportId: string
  reportTitle: string
  reportEmail: string | null
  category: string | null
  type: 'sent' | 'received'
  text: string
  at: string
}

type TypeFilter = 'all' | 'sent' | 'received'

export default function EmailsPage() {
  const router = useRouter()
  const { reports, loading } = useFeedback()

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [userFilter, setUserFilter] = useState('')
  const { checkEmails, checkingEmails, checkResult } = useCheckEmails()

  // Auto-polling každých 30 s dokud je stránka zobrazená
  useEffect(() => {
    const timer = setInterval(() => { checkEmails() }, 30_000)
    return () => clearInterval(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const entries = useMemo<EmailEntry[]>(() => {
    const list: EmailEntry[] = []
    for (const r of reports) {
      for (const n of r.notes ?? []) {
        if (n.text.startsWith(SENT_PREFIX)) {
          list.push({
            reportId: r.id,
            reportTitle: deriveTitle(r.comment),
            reportEmail: r.user_email,
            category: r.category,
            type: 'sent',
            text: n.text.slice(SENT_PREFIX.length),
            at: n.at,
          })
        } else if (n.text.startsWith(RECV_PREFIX)) {
          list.push({
            reportId: r.id,
            reportTitle: deriveTitle(r.comment),
            reportEmail: r.user_email,
            category: r.category,
            type: 'received',
            text: stripEmailQuote(n.text.slice(RECV_PREFIX.length)),
            at: n.at,
          })
        }
      }
    }
    return list.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  }, [reports])

  // Distinct emails z reportů které mají alespoň jeden e-mail záznam
  const userEmails = useMemo(() => {
    const seen = new Set<string>()
    entries.forEach(e => { if (e.reportEmail) seen.add(e.reportEmail) })
    return Array.from(seen).sort()
  }, [entries])

  // AND filtrování
  const filtered = useMemo(() => {
    let list = entries
    if (typeFilter !== 'all') list = list.filter(e => e.type === typeFilter)
    if (userFilter) list = list.filter(e => e.reportEmail === userFilter)
    return list
  }, [entries, typeFilter, userFilter])

  const sentCount     = entries.filter(e => e.type === 'sent').length
  const receivedCount = entries.filter(e => e.type === 'received').length

  if (loading) return (
    <div className="empty" style={{ marginTop: 80 }}><span>Načítám...</span></div>
  )

  const chips: Array<{ id: TypeFilter; label: string; count: number; color?: string }> = [
    { id: 'all',      label: 'Vše',       count: entries.length },
    { id: 'sent',     label: 'Odeslané',  count: sentCount,     color: 'accent' },
    { id: 'received', label: 'Přijaté',   count: receivedCount, color: 'green' },
  ]

  return (
    <>
      <div className="page-header">
        <div>
          <h1>E-maily</h1>
          <p>Historie odpovědí přes všechny feedbacky</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'var(--surface)', border: '1px solid var(--border)',
            color: 'var(--text-2)', padding: '7px 13px', borderRadius: 10, fontSize: 13, fontWeight: 700,
          }}>
            <Icon name="mail" size={15} style={{ color: 'var(--text-3)' }} />
            {filtered.length} zpráv
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
          {/* Type chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {chips.map(chip => {
              const active = typeFilter === chip.id
              const accentColor = chip.color === 'accent'
                ? 'var(--accent-hi)'
                : chip.color === 'green'
                  ? 'oklch(0.74 0.14 150)'
                  : null
              return (
                <button
                  key={chip.id}
                  onClick={() => setTypeFilter(chip.id)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '7px 13px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                    color: active ? 'var(--bg)' : 'var(--text-2)',
                    background: active ? 'var(--text)' : 'var(--surface)',
                    border: `1px solid ${active ? 'var(--text)' : 'var(--border)'}`,
                    transition: 'all 0.14s', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {accentColor && !active && (
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: accentColor, flexShrink: 0 }} />
                  )}
                  {chip.label}
                  <span style={{ fontSize: 11.5, opacity: active ? 0.6 : 1 }}>{chip.count}</span>
                </button>
              )
            })}
          </div>

          {/* User dropdown */}
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

        {/* Seznam */}
        {filtered.length === 0 ? (
          <div className="empty">
            <Icon name="mail" size={28} />
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-2)' }}>
              {entries.length === 0
                ? 'Zatím žádná e-mailová komunikace.'
                : 'Žádné e-maily neodpovídají filtru.'}
            </div>
            {entries.length === 0
              ? <p>E-maily se zde zobrazí, jakmile odešleš první odpověď.</p>
              : <button className="btn btn-outline" style={{ marginTop: 12 }}
                  onClick={() => { setTypeFilter('all'); setUserFilter('') }}>
                  Zrušit filtry
                </button>
            }
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((e, i) => {
              const isSent = e.type === 'sent'
              const snippet = e.text.length > 150 ? e.text.slice(0, 150) + '…' : e.text
              return (
                <button
                  key={i}
                  onClick={() => router.push(`/dashboard/${e.reportId}?tab=emails`)}
                  style={{
                    display: 'flex', alignItems: 'stretch', gap: 14, textAlign: 'left',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 13, padding: '14px 16px',
                    boxShadow: 'var(--shadow)', width: '100%', fontFamily: 'inherit',
                    cursor: 'pointer', transition: 'transform 0.15s, border-color 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={ev => {
                    ev.currentTarget.style.transform = 'translateY(-1px)'
                    ev.currentTarget.style.borderColor = 'var(--border-2)'
                    ev.currentTarget.style.boxShadow = 'var(--shadow-lg)'
                  }}
                  onMouseLeave={ev => {
                    ev.currentTarget.style.transform = ''
                    ev.currentTarget.style.borderColor = 'var(--border)'
                    ev.currentTarget.style.boxShadow = 'var(--shadow)'
                  }}
                >
                  {/* Směr ikona */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', flexShrink: 0, paddingTop: 2 }}>
                    <span style={{
                      width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center',
                      background: isSent ? 'var(--accent-soft)' : 'oklch(0.7 0.12 150 / 0.14)',
                      border: isSent ? '1px solid var(--accent-line)' : '1px solid oklch(0.7 0.12 150 / 0.28)',
                    }}>
                      <Icon name="mail" size={15} style={{ color: isSent ? 'var(--accent-hi)' : 'oklch(0.74 0.14 150)' }} />
                    </span>
                  </div>

                  {/* Obsah */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {/* Badges + title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <CatBadge cat={e.category || 'other'} size="sm" />
                      <span style={{
                        fontSize: 11.5, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                        color: isSent ? 'var(--accent-hi)' : 'oklch(0.74 0.14 150)',
                        background: isSent ? 'var(--accent-soft)' : 'oklch(0.7 0.12 150 / 0.12)',
                      }}>
                        {isSent ? 'Odesláno' : 'Přijato'}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
                        {e.reportTitle}
                      </span>
                    </div>

                    {/* E-mail uživatele */}
                    {e.reportEmail && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Avatar email={e.reportEmail} size={16} />
                        <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>{e.reportEmail}</span>
                      </div>
                    )}

                    {/* Snippet */}
                    <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                      {snippet}
                    </p>
                  </div>

                  {/* Čas + šipka */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', flexShrink: 0 }}>
                    <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {timeAgo(e.at)}
                    </span>
                    <Icon name="chevronRight" size={16} style={{ color: 'var(--text-3)' }} />
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
