import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { validateEmail } from '@/utils/validateEmail'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = String(body.email ?? '').trim().toLowerCase()
    const source = typeof body.source === 'string' ? body.source : 'landing_page'

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const emailCheck = validateEmail(email)
    if (!emailCheck.valid) {
      return NextResponse.json({ error: emailCheck.warning ?? 'Invalid email format' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, is_active')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      if (existing.is_active) {
        return NextResponse.json({ error: 'This email is already subscribed' }, { status: 409 })
      }
      const { error: reactivateError } = await supabase
        .from('newsletter_subscribers')
        .update({ is_active: true, subscribed_at: new Date().toISOString() })
        .eq('id', existing.id)

      if (reactivateError) { throw reactivateError }

      return NextResponse.json({ message: 'Successfully re-subscribed!', emailWarning: emailCheck.warning ?? null })
    }

    const { error: insertError } = await supabase
      .from('newsletter_subscribers')
      .insert({ email, source, is_active: true })

    if (insertError) { throw insertError }

    return NextResponse.json(
      { message: 'Successfully subscribed! Thank you for joining us.', emailWarning: emailCheck.warning ?? null },
      { status: 201 }
    )
  } catch (error) {
    console.error('Newsletter subscribe error:', error)
    return NextResponse.json({ error: 'Failed to subscribe. Please try again.' }, { status: 500 })
  }
}
