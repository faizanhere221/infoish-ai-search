import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

// GET /api/admin/contact-submissions - list contact form messages (admin only, gated by middleware)
export async function GET() {
  try {
    const supabase = createServerSupabase()

    const { data: messages, error } = await supabase
      .from('contact_messages')
      .select('id, name, email, company, subject, message, is_read, created_at')
      .order('created_at', { ascending: false })

    if (error) { throw error }

    const submissions = (messages ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      company: m.company,
      subject: m.subject,
      message: m.message,
      submitted_at: m.created_at,
      status: m.is_read ? 'read' : 'new',
    }))

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Admin contact-submissions fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
  }
}
