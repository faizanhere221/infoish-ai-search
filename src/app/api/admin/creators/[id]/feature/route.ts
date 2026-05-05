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
    const featured = body.featured !== false

    const supabase = createServerSupabase()
    const { data: creator, error } = await supabase
      .from('creators')
      .update({ is_featured: featured })
      .eq('id', params.id)
      .select('id, username, is_featured')
      .single()

    if (error || !creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    void logActivity({
      userId: adminId,
      action: featured ? 'creator_featured' : 'creator_unfeatured',
      entityType: 'creator',
      entityId: params.id,
      details: { username: creator.username },
    })

    return NextResponse.json({ success: true, creator })
  } catch (err) {
    console.error('Feature creator error:', err)
    return NextResponse.json({ error: 'Failed to update creator' }, { status: 500 })
  }
}
