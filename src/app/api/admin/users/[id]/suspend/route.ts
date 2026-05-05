import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { logActivity } from '@/lib/activity'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminId = request.headers.get('x-user-id') ?? undefined
    const supabase = createServerSupabase()

    const { data: user, error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', params.id)
      .select('id, email, role')
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    void logActivity({
      userId: adminId,
      action: 'user_suspended',
      entityType: 'user',
      entityId: params.id,
      details: { target_email: user.email },
    })

    return NextResponse.json({ success: true, user })
  } catch (err) {
    console.error('Suspend user error:', err)
    return NextResponse.json({ error: 'Failed to suspend user' }, { status: 500 })
  }
}
