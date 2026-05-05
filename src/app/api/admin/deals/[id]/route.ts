import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { logActivity } from '@/lib/activity'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabase()

    const { data: deal, error } = await supabase
      .from('deals')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    const [{ data: brand }, { data: creator }] = await Promise.all([
      supabase.from('brands').select('id, company_name, logo_url').eq('id', deal.brand_id).single(),
      supabase.from('creators').select('id, username, display_name, profile_picture_url').eq('id', deal.creator_id).single(),
    ])

    return NextResponse.json({ deal, brand, creator })
  } catch (err) {
    console.error('Admin deal detail error:', err)
    return NextResponse.json({ error: 'Failed to fetch deal' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminId = request.headers.get('x-user-id') ?? undefined
    const supabase = createServerSupabase()
    const body = await request.json()

    const ALLOWED = new Set(['status', 'amount', 'currency', 'notes'])
    const updates: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(body)) {
      if (ALLOWED.has(k)) updates[k] = v
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data: deal, error } = await supabase
      .from('deals')
      .update(updates)
      .eq('id', params.id)
      .select('id, status, title')
      .single()

    if (error) throw error

    void logActivity({
      userId: adminId,
      action: 'deal_updated',
      entityType: 'deal',
      entityId: params.id,
      details: { updates, title: deal?.title },
    })

    return NextResponse.json({ deal })
  } catch (err) {
    console.error('Admin deal update error:', err)
    return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 })
  }
}
