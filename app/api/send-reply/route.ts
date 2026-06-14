import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { feedbackId, replyText } = await req.json()

    if (!feedbackId || !replyText?.trim()) {
      return NextResponse.json({ error: 'Chybí feedbackId nebo text odpovědi.' }, { status: 400 })
    }

    const { data: feedback, error: dbError } = await supabase
      .from('feedback')
      .select('user_email, comment, category')
      .eq('id', feedbackId)
      .single()

    if (dbError || !feedback) {
      return NextResponse.json({ error: 'Feedback nenalezen.' }, { status: 404 })
    }

    if (!feedback.user_email) {
      return NextResponse.json({ error: 'Feedback nemá e-mail uživatele.' }, { status: 422 })
    }

    const category = feedback.category ?? 'obecná'
    const originalComment = feedback.comment?.trim()
    const bodyText = replyText.trim()
      + (originalComment ? `\n\n---\nPůvodní zpráva:\n${originalComment}` : '')

    const emailPayload: Parameters<typeof resend.emails.send>[0] = {
      from: 'Wexia Feedback <onboarding@resend.dev>',
      to: [feedback.user_email],
      subject: `Re: Vaše zpětná vazba (${category})`,
      text: bodyText,
    }

    if (process.env.REPLY_TO_EMAIL) {
      emailPayload.replyTo = process.env.REPLY_TO_EMAIL
    }

    const { error: sendError } = await resend.emails.send(emailPayload)

    if (sendError) {
      return NextResponse.json({ error: sendError.message }, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Neznámá chyba.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
