import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabase()
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, user_type, role, is_active, email_verified, created_at, last_login_at')
      .eq('id', params.id)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch profile
    let profile: Record<string, unknown> | null = null
    if (user.user_type === 'creator') {
      const { data } = await supabase
        .from('creators')
        .select('id, username, display_name, country, niches, total_followers, avg_rating, completed_deals, verification_status, is_available')
        .eq('user_id', user.id)
        .single()
      profile = data
    } else if (user.user_type === 'brand') {
      const { data } = await supabase
        .from('brands')
        .select('id, company_name, company_website, industry, company_size, country, total_deals, total_spent, verification_status')
        .eq('user_id', user.id)
        .single()
      profile = data
    }

    // Fetch recent deals
    let deals: unknown[] = []
    if (profile?.id) {
      const field = user.user_type === 'creator' ? 'creator_id' : 'brand_id'
      const { data } = await supabase
        .from('deals')
        .select('id, title, status, amount, currency, created_at')
        .eq(field, String(profile.id))
        .order('created_at', { ascending: false })
        .limit(5)
      deals = data ?? []
    }

    return NextResponse.json({ user, profile, deals })
  } catch (err) {
    console.error('Admin user detail error:', err)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabase()
    const callerRole = request.headers.get('x-user-role') ?? 'user'
    const body = await request.json()

    const updates: Record<string, unknown> = {}

    if ('is_active' in body) updates.is_active = Boolean(body.is_active)

    if ('role' in body && callerRole === 'super_admin') {
      const newRole = body.role as string
      if (!['user', 'admin', 'super_admin'].includes(newRole)) {
        return NextResponse.json({ error: 'Invalid role value' }, { status: 400 })
      }
      updates.role = newRole
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', params.id)
      .select('id, email, user_type, role, is_active')
      .single()

    if (error) throw error
    return NextResponse.json({ user: data })
  } catch (err) {
    console.error('Admin user update error:', err)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabase()
    const { error } = await supabase.from('users').delete().eq('id', params.id)
    if (error) throw error
    return NextResponse.json({ message: 'User deleted' })
  } catch (err) {
    console.error('Admin user delete error:', err)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
