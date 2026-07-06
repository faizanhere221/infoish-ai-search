import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { validateEmail } from '@/utils/validateEmail'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = String(body.name ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()
    const company = body.company ? String(body.company).trim() : null
    const subject = String(body.subject ?? 'general').trim()
    const message = String(body.message ?? '').trim()

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 })
    }

    const emailCheck = validateEmail(email)
    if (!emailCheck.valid) {
      return NextResponse.json({ error: emailCheck.warning ?? 'Invalid email format' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    const { error: insertError } = await supabase.from('contact_messages').insert({
      name,
      email,
      company,
      subject,
      message,
      is_read: false,
    })

    if (insertError) { throw insertError }

    return NextResponse.json(
      { success: true, message: 'Message sent successfully', emailWarning: emailCheck.warning ?? null },
      { status: 201 }
    )
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json({ success: false, error: 'Failed to send message. Please try again.' }, { status: 500 })
  }
}
