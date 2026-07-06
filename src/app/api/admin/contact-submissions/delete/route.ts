import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    const { error } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', id)

    if (error) { throw error }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin contact-submissions delete error:', error)
    return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 })
  }
}
