import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { id, status } = await request.json()

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    const { error } = await supabase
      .from('contact_messages')
      .update({ is_read: status !== 'new' })
      .eq('id', id)

    if (error) { throw error }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin contact-submissions update error:', error)
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 })
  }
}
