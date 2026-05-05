import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabase()

    const { data: brand, error } = await supabase
      .from('brands')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    const [{ data: user }, { data: deals }] = await Promise.all([
      supabase.from('users').select('id, email, is_active, last_login_at, role, created_at').eq('id', brand.user_id).single(),
      supabase.from('deals').select('id, title, status, amount, currency, created_at').eq('brand_id', brand.id).order('created_at', { ascending: false }).limit(5),
    ])

    return NextResponse.json({ brand, user, deals })
  } catch (err) {
    console.error('Admin brand detail error:', err)
    return NextResponse.json({ error: 'Failed to fetch brand' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabase()
    const body = await request.json()

    const ALLOWED = new Set(['verification_status'])
    const updates: Record<string, unknown> = {}

    for (const [k, v] of Object.entries(body)) {
      if (ALLOWED.has(k)) updates[k] = v
    }

    if ('is_active' in body) {
      const { data: brand } = await supabase
        .from('brands').select('user_id').eq('id', params.id).single()
      if (brand?.user_id) {
        await supabase
          .from('users')
          .update({ is_active: Boolean(body.is_active) })
          .eq('id', brand.user_id)
      }
    }

    if (Object.keys(updates).length === 0 && !('is_active' in body)) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    let brandData = null
    if (Object.keys(updates).length > 0) {
      const { data, error } = await supabase
        .from('brands')
        .update(updates)
        .eq('id', params.id)
        .select('id, verification_status')
        .single()
      if (error) throw error
      brandData = data
    }

    return NextResponse.json({ brand: brandData })
  } catch (err) {
    console.error('Admin brand update error:', err)
    return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 })
  }
}
