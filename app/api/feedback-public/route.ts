import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 30
export const dynamic = 'force-dynamic'

// Widget běží na libovolné klientské doméně → povolujeme všechny originy.
// Auth řeší x-wexia-key (publishable klíč), ne cookies, proto je '*' bezpečné.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-wexia-key',
  'Access-Control-Max-Age': '86400',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

interface FeedbackPayload {
  source_app: string
  category: string
  comment: string
  screenshot_base64?: string
  url: string
  user_agent: string
  user_email?: string
  user_name?: string
  element_selector?: string
  timestamp: string
}

export async function POST(req: NextRequest) {
  // Auth check
  const apiKey = req.headers.get('x-wexia-key')
  const expectedKey = process.env.WIDGET_API_KEY
  if (!expectedKey || apiKey !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS })
  }

  try {
    const body: FeedbackPayload = await req.json()

    const { source_app, category, comment, screenshot_base64, url, user_agent, user_email, user_name, element_selector, timestamp } = body

    if (!comment?.trim()) {
      return NextResponse.json({ error: 'comment is required' }, { status: 400, headers: CORS_HEADERS })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500, headers: CORS_HEADERS })
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    let screenshot_url: string | null = null

    if (screenshot_base64) {
      const buffer = Buffer.from(screenshot_base64, 'base64')
      const fileName = `${source_app}_${Date.now()}.png`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('feedback-screenshots')
        .upload(fileName, buffer, { contentType: 'image/png' })

      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from('feedback-screenshots')
          .getPublicUrl(uploadData.path)
        screenshot_url = urlData.publicUrl
      }
    }

    const { data, error } = await supabase
      .from('feedback')
      .insert({
        source_app,
        category: category || 'bug',
        comment: comment.trim(),
        screenshot_url,
        url: url || '',
        user_agent: user_agent || '',
        user_email: user_email || null,
        user_name: user_name || null,
        element_selector: element_selector || '',
        timestamp: timestamp || new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      console.error('feedback-public: DB error', error)
      return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS })
    }

    return NextResponse.json({ success: true, id: data.id }, { headers: CORS_HEADERS })
  } catch (err) {
    console.error('feedback-public: unexpected error', err)
    return NextResponse.json({ error: String(err) }, { status: 500, headers: CORS_HEADERS })
  }
}
