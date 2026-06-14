import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET() {
  try {
    const oauth2 = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET
    )
    oauth2.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN })

    const gmail = google.gmail({ version: 'v1', auth: oauth2 })

    // Všechny nepřečtené zprávy, bez to: filtru
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread',
      maxResults: 10,
    })

    const messages = listRes.data.messages ?? []

    const results = await Promise.all(
      messages.map(async msg => {
        if (!msg.id) return null
        const full = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'metadata',
          metadataHeaders: ['From', 'To', 'Subject'],
        })
        const headers = full.data.payload?.headers ?? []
        const get = (name: string) =>
          headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value ?? ''
        return {
          id: msg.id,
          from: get('From'),
          to: get('To'),
          subject: get('Subject'),
          snippet: full.data.snippet ?? '',
        }
      })
    )

    return NextResponse.json({
      totalFound: messages.length,
      messages: results.filter(Boolean),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
