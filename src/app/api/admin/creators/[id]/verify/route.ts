import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { logActivity } from '@/lib/activity'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminId = request.headers.get('x-user-id') ?? undefined
    const body = await request.json().catch(() => ({}))
    const status = body.status === 'unverified' ? 'unverified' : 'verified'

    const supabase = createServerSupabase()
    const { data: creator, error } = await supabase
      .from('creators')
      .update({ verification_status: status })
      .eq('id', params.id)
      .select('id, username, verification_status')
      .single()

    if (error || !creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    void logActivity({
      userId: adminId,
      action: status === 'verified' ? 'creator_verified' : 'creator_unverified',
      entityType: 'creator',
      entityId: params.id,
      details: { username: creator.username },
    })

    return NextResponse.json({ success: true, creator })
  } catch (err) {
    console.error('Verify creator error:', err)
    return NextResponse.json({ error: 'Failed to verify creator' }, { status: 500 })
  }
}
