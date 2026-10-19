import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { validateEmail } from '@/utils/validateEmail'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// POST /api/newsletter/subscribe
// Referenced by src/components/footer.tsx and src/components/NewsletterForm.tsx
// (and already carved out as a public route in src/middleware.ts), but this
// route handler did not previously exist — every newsletter signup on the
// site was silently 404ing.
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const { allowed, retryAfterMs } = await rateLimit(`newsletter:${ip}`, 5, 60 * 1000)
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
      )
    }

    const body = await request.json()

    // Honeypot — real visitors never fill this in.
    if (String(body.website ?? '').trim()) {
      return NextResponse.json({ success: true, message: 'Successfully subscribed! Thank you for joining us.' }, { status: 201 })
    }

    const email = String(body.email ?? '').trim().toLowerCase()
    const source = body.source ? String(body.source).slice(0, 50) : 'landing_page'

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })
    }

    const emailCheck = validateEmail(email)
    if (!emailCheck.valid) {
      return NextResponse.json({ success: false, error: emailCheck.warning ?? 'Invalid email format' }, { status: 400 })
    }

    const supabase = createServerSupabase()
    const { error } = await supabase.from('newsletter_subscribers').insert({ email, source })

    if (error) {
      // Unique violation = already subscribed, not a real error.
      if (error.code === '23505') {
        return NextResponse.json({ success: false, message: 'You are already subscribed!' }, { status: 200 })
      }
      throw error
    }

    return NextResponse.json(
      { success: true, message: 'Successfully subscribed! Thank you for joining us.' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Newsletter subscribe error:', error)
    return NextResponse.json({ success: false, error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
