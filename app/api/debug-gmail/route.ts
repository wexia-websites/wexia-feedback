import { NextResponse } from 'next/server'

export async function GET() {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: process.env.GMAIL_CLIENT_ID ?? '',
    client_secret: process.env.GMAIL_CLIENT_SECRET ?? '',
    refresh_token: process.env.GMAIL_REFRESH_TOKEN ?? '',
  })

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  const googleResponse = await res.json()

  return NextResponse.json({
    status: res.status,
    googleResponse,
    envLengths: {
      clientId: process.env.GMAIL_CLIENT_ID?.length ?? null,
      clientSecret: process.env.GMAIL_CLIENT_SECRET?.length ?? null,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN?.length ?? null,
    },
  })
}
