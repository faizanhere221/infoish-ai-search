import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

const VALID_SORT = new Set(['created_at', 'last_login_at', 'email'])

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const { searchParams } = new URL(request.url)

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
    const search = searchParams.get('search') ?? ''
    const userType = searchParams.get('type') ?? 'all'
    const status = searchParams.get('status') ?? 'all'
    const role = searchParams.get('role') ?? 'all'
    const dateFrom = searchParams.get('date_from') ?? ''
    const dateTo = searchParams.get('date_to') ?? ''
    const sortBy = VALID_SORT.has(searchParams.get('sort_by') ?? '') ? (searchParams.get('sort_by') as string) : 'created_at'
    const sortAsc = searchParams.get('sort_order') === 'asc'

    let query = supabase
      .from('users')
      .select('id, email, user_type, role, is_active, email_verified, created_at, last_login_at', { count: 'exact' })
      .order(sortBy, { ascending: sortAsc })
      .range((page - 1) * limit, page * limit - 1)

    if (search) query = query.ilike('email', `%${search}%`)
    if (userType !== 'all') query = query.eq('user_type', userType)
    if (status === 'active') query = query.eq('is_active', true)
    if (status === 'suspended') query = query.eq('is_active', false)
    if (role !== 'all') query = query.eq('role', role)
    if (dateFrom) query = query.gte('created_at', dateFrom)
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')

    const { data: users, count, error } = await query
    if (error) throw error

    if (!users?.length) {
      return NextResponse.json({ users: [], total: count ?? 0, page, limit })
    }

    // Enrich with profile name/username in two batch queries
    const creatorUserIds = users.filter(u => u.user_type === 'creator').map(u => u.id)
    const brandUserIds = users.filter(u => u.user_type === 'brand').map(u => u.id)

    const [{ data: creators }, { data: brands }] = await Promise.all([
      creatorUserIds.length
        ? supabase.from('creators').select('user_id, username, display_name').in('user_id', creatorUserIds)
        : Promise.resolve({ data: [] }),
      brandUserIds.length
        ? supabase.from('brands').select('user_id, company_name').in('user_id', brandUserIds)
        : Promise.resolve({ data: [] }),
    ])

    const creatorMap = new Map((creators ?? []).map(c => [c.user_id, c]))
    const brandMap = new Map((brands ?? []).map(b => [b.user_id, b]))

    const enriched = users.map(u => {
      if (u.user_type === 'creator') {
        const p = creatorMap.get(u.id)
        return { ...u, profile_name: p?.display_name ?? '', profile_username: p?.username ?? '' }
      }
      if (u.user_type === 'brand') {
        const p = brandMap.get(u.id)
        return { ...u, profile_name: p?.company_name ?? '', profile_username: '' }
      }
      return { ...u, profile_name: '', profile_username: '' }
    })

    return NextResponse.json({ users: enriched, total: count ?? 0, page, limit })
  } catch (err) {
    console.error('Admin users list error:', err)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
