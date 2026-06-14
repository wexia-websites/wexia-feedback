'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useFeedback } from '@/lib/feedback-context'
import { Icon, CatBadge, timeAgo, deriveTitle, type CategoryId } from '@/lib/feedback-ui'

const SENT_PREFIX = '📧 Odpověď uživateli: '
const RECV_PREFIX = '📨 Odpověď od uživatele:\n'

type EmailEntry = {
  reportId: string
  reportTitle: string
  category: string | null
  type: 'sent' | 'received'
  text: string
  at: string
}

export default function EmailsPage() {
  const router = useRouter()
  const { reports, loading } = useFeedback()

  const entries = useMemo<EmailEntry[]>(() => {
    const list: EmailEntry[] = []
    for (const r of reports) {
      for (const n of r.notes ?? []) {
        if (n.text.startsWith(SENT_PREFIX)) {
          list.push({
            reportId: r.id,
            reportTitle: deriveTitle(r.comment),
            category: r.category,
            type: 'sent',
            text: n.text.slice(SENT_PREFIX.length),
            at: n.at,
          })
        } else if (n.text.startsWith(RECV_PREFIX)) {
          list.push({
            reportId: r.id,
            reportTitle: deriveTitle(r.comment),
            category: r.category,
            type: 'received',
            text: n.text.slice(RECV_PREFIX.length),
            at: n.at,
          })
        }
      }
    }
    return list.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  }, [reports])

  if (loading) return (
    <div className="empty" style={{ marginTop: 80 }}><span>Načítám...</span></div>
  )

  return (
    <>
      <div className="page-header">
        <div>
          <h1>E-maily</h1>
          <p>Historie odpovědí přes všechny feedbacky</p>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: 'var(--surface)', border: '1px solid var(--border)',
          color: 'var(--text-2)', padding: '7px 13px', borderRadius: 10, fontSize: 13, fontWeight: 700,
        }}>
          <Icon name="mail" size={15} style={{ color: 'var(--text-3)' }} />
          {entries.length} zpráv
        </div>
      </div>

      <div className="page-body">
        {entries.length === 0 ? (
          <div className="empty">
            <Icon name="mail" size={28} />
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-2)' }}>
              Zatím žádná e-mailová komunikace.
            </div>
            <p>E-maily se zde zobrazí, jakmile odešleš první odpověď.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {entries.map((e, i) => {
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
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.borderColor = 'var(--border-2)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = ''
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.boxShadow = 'var(--shadow)'
                  }}
                >
                  {/* Směr ikona */}
                  <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, paddingTop: 2 }}>
                    <span style={{
                      width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center',
                      background: isSent ? 'var(--accent-soft)' : 'oklch(0.7 0.12 150 / 0.14)',
                      border: isSent ? '1px solid var(--accent-line)' : '1px solid oklch(0.7 0.12 150 / 0.28)',
                    }}>
                      <Icon
                        name="mail" size={15}
                        style={{ color: isSent ? 'var(--accent-hi)' : 'oklch(0.74 0.14 150)' }}
                      />
                    </span>
                  </div>

                  {/* Obsah */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <CatBadge cat={e.category || 'other'} size="sm" />
                      <span style={{
                        fontSize: 11.5, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                        color: isSent ? 'var(--accent-hi)' : 'oklch(0.74 0.14 150)',
                        background: isSent ? 'var(--accent-soft)' : 'oklch(0.7 0.12 150 / 0.12)',
                      }}>
                        {isSent ? 'Odesláno' : 'Přijato'}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>
                        {e.reportTitle}
                      </span>
                    </div>
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
