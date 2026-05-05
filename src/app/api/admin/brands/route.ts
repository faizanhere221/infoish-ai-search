import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

const VALID_SORT = new Set(['created_at', 'total_deals', 'total_spent', 'company_name'])

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const { searchParams } = new URL(request.url)

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
    const search = searchParams.get('search') ?? ''
    const industry = searchParams.get('industry') ?? ''
    const companySize = searchParams.get('company_size') ?? ''
    const country = searchParams.get('country') ?? ''
    const minSpent = searchParams.get('min_spent') ? parseFloat(searchParams.get('min_spent')!) : null
    const maxSpent = searchParams.get('max_spent') ? parseFloat(searchParams.get('max_spent')!) : null
    const status = searchParams.get('status') ?? 'all'
    const verificationStatus = searchParams.get('verification_status') ?? ''
    const dateFrom = searchParams.get('date_from') ?? ''
    const dateTo = searchParams.get('date_to') ?? ''
    const sortBy = VALID_SORT.has(searchParams.get('sort_by') ?? '') ? (searchParams.get('sort_by') as string) : 'created_at'
    const sortAsc = searchParams.get('sort_order') === 'asc'

    const emailSearch = search.includes('@') ? search : ''
    const needsUserFilter = status !== 'all' || !!emailSearch

    let userIdFilter: string[] | null = null
    if (needsUserFilter) {
      let userQuery = supabase.from('users').select('id').eq('user_type', 'brand')
      if (status === 'active') userQuery = userQuery.eq('is_active', true)
      if (status === 'suspended') userQuery = userQuery.eq('is_active', false)
      if (emailSearch) userQuery = userQuery.ilike('email', `%${emailSearch}%`)

      const { data: matchedUsers } = await userQuery
      userIdFilter = (matchedUsers ?? []).map(u => u.id)
      if (userIdFilter.length === 0) {
        return NextResponse.json({ brands: [], total: 0, page, limit })
      }
    }

    let query = supabase
      .from('brands')
      .select(
        'id, user_id, company_name, company_website, logo_url, industry, company_size, country, contact_name, contact_role, total_deals, total_spent, verification_status, created_at',
        { count: 'exact' }
      )
      .order(sortBy, { ascending: sortAsc })
      .range((page - 1) * limit, page * limit - 1)

    if (search && !emailSearch) {
      query = query.ilike('company_name', `%${search}%`)
    }
    if (industry) query = query.eq('industry', industry)
    if (companySize) query = query.eq('company_size', companySize)
    if (country) query = query.eq('country', country)
    if (minSpent !== null) query = query.gte('total_spent', minSpent)
    if (maxSpent !== null) query = query.lte('total_spent', maxSpent)
    if (verificationStatus) query = query.eq('verification_status', verificationStatus)
    if (dateFrom) query = query.gte('created_at', dateFrom)
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')
    if (userIdFilter) query = query.in('user_id', userIdFilter)

    const { data: brands, count, error } = await query
    if (error) throw error

    if (!brands?.length) {
      return NextResponse.json({ brands: [], total: count ?? 0, page, limit })
    }

    const userIds = brands.map(b => b.user_id)
    const { data: users } = await supabase
      .from('users')
      .select('id, email, is_active, last_login_at, role')
      .in('id', userIds)

    const userMap = new Map((users ?? []).map(u => [u.id, u]))
    const enriched = brands.map(b => ({
      ...b,
      email: userMap.get(b.user_id)?.email ?? '',
      is_active: userMap.get(b.user_id)?.is_active ?? true,
      last_login_at: userMap.get(b.user_id)?.last_login_at ?? null,
      role: userMap.get(b.user_id)?.role ?? 'user',
    }))

    return NextResponse.json({ brands: enriched, total: count ?? 0, page, limit })
  } catch (err) {
    console.error('Admin brands error:', err)
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 })
  }
}
