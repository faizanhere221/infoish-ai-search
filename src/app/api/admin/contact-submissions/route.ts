import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

export async function GET() {
  try {
    const supabase = createServerSupabase()

    const { data, error } = await supabase
      .from('contact_messages')
      .select('id, name, email, company, subject, message, created_at, is_read')
      .order('created_at', { ascending: false })

    if (error) { throw error }

    const submissions = (data ?? []).map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      company: row.company ?? '',
      subject: row.subject,
      message: row.message,
      submitted_at: row.created_at,
      status: row.is_read ? 'read' : 'new',
    }))

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Admin contact-submissions error:', error)
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
  }
}
