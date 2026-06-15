import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const FEEDBACK_ID_RE = /wexia\.feedback\+([a-z0-9-]+)@gmail\.com/i

function decodeBase64Url(s: string): string {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
}

function getHeader(headers: Array<{ name?: string | null; value?: string | null }>, name: string): string {
  return headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value ?? ''
}

function extractPlainText(payload: any): string {
  if (!payload) return ''

  // Přímý text/plain part
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return decodeBase64Url(payload.body.data)
  }

  // Rekurzivně hledej v parts
  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractPlainText(part)
      if (text) return text
    }
  }

  return ''
}

export async function POST() {
  try {
    const oauth2 = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET
    )
    oauth2.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN })

    const gmail = google.gmail({ version: 'v1', auth: oauth2 })

    const listRes = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread',
      maxResults: 50,
    })

    const messages = listRes.data.messages ?? []
    let processed = 0

    for (const msg of messages) {
      if (!msg.id) continue

      const full = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full',
      })

      const headers = full.data.payload?.headers ?? []
      const toHeader = getHeader(headers, 'To')
      const dateHeader = getHeader(headers, 'Date')

      // Extrahuj feedback ID z "To" hlavičky
      const match = FEEDBACK_ID_RE.exec(toHeader)
      if (!match) continue
      const feedbackId = match[1]

      // Tělo zprávy (plain text)
      const body = extractPlainText(full.data.payload).trim()
      if (!body) continue

      // ISO datum z e-mailu (fallback na teď)
      const sentAt = dateHeader ? new Date(dateHeader).toISOString() : new Date().toISOString()

      // Načti existující notes a zkontroluj duplicitu
      const { data: feedback } = await supabase
        .from('feedback')
        .select('notes')
        .eq('id', feedbackId)
        .maybeSingle()

      if (!feedback) continue

      const existingNotes = (feedback.notes ?? []) as Array<{ author: string; at: string; text: string; gmailMessageId?: string }>

      // Přeskoč pokud zprávu už máme (dedup podle gmailMessageId)
      if (existingNotes.some(n => n.gmailMessageId === msg.id)) continue

      const newNote = {
        author: 'Uživatel',
        at: sentAt,
        text: `📨 Odpověď od uživatele:\n${body}`,
        gmailMessageId: msg.id,
      }

      await supabase
        .from('feedback')
        .update({ notes: [...existingNotes, newNote] })
        .eq('id', feedbackId)

      processed++
    }

    return NextResponse.json({ processed })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Neznámá chyba.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
