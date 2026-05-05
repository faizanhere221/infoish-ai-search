import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabase()

    const { data: creator, error } = await supabase
      .from('creators')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    const [{ data: user }, { data: platforms }, { data: services }, { data: deals }] = await Promise.all([
      supabase.from('users').select('id, email, is_active, last_login_at, role, created_at').eq('id', creator.user_id).single(),
      supabase.from('creator_platforms').select('*').eq('creator_id', creator.id),
      supabase.from('creator_services').select('id, title, platform, price, currency, is_active').eq('creator_id', creator.id),
      supabase.from('deals').select('id, title, status, amount, currency, created_at').eq('creator_id', creator.id).order('created_at', { ascending: false }).limit(5),
    ])

    return NextResponse.json({ creator, user, platforms, services, deals })
  } catch (err) {
    console.error('Admin creator detail error:', err)
    return NextResponse.json({ error: 'Failed to fetch creator' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabase()
    const body = await request.json()

    const ALLOWED = new Set(['verification_status', 'is_available', 'is_featured'])
    const updates: Record<string, unknown> = {}

    for (const [k, v] of Object.entries(body)) {
      if (ALLOWED.has(k)) updates[k] = v
    }

    // Handle user-level is_active via the users table
    if ('is_active' in body) {
      const { data: creator } = await supabase
        .from('creators').select('user_id').eq('id', params.id).single()

      if (creator?.user_id) {
        await supabase
          .from('users')
          .update({ is_active: Boolean(body.is_active) })
          .eq('id', creator.user_id)
      }
    }

    if (Object.keys(updates).length === 0 && !('is_active' in body)) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    let creatorData = null
    if (Object.keys(updates).length > 0) {
      const { data, error } = await supabase
        .from('creators')
        .update(updates)
        .eq('id', params.id)
        .select('id, verification_status, is_available, is_featured')
        .single()
      if (error) throw error
      creatorData = data
    }

    return NextResponse.json({ creator: creatorData })
  } catch (err) {
    console.error('Admin creator update error:', err)
    return NextResponse.json({ error: 'Failed to update creator' }, { status: 500 })
  }
}
