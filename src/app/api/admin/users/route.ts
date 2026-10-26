import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const VALID_SORT = new Set(['created_at', 'last_login_at', 'email'])

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const { searchParams } = new URL(request.url)
    const callerRole = request.headers.get('x-user-role') ?? 'user'

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
    const search = searchParams.get('search') ?? ''
    const userType = searchParams.get('type') ?? 'all'
    const status = searchParams.get('status') ?? 'all'

    if (status === 'deleted' && callerRole !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin only' }, { status: 403 })
    }
    const role = searchParams.get('role') ?? 'all'
    const verified = searchParams.get('verified') ?? ''
    const featured = searchParams.get('featured') === 'true'
    const dateFrom = searchParams.get('date_from') ?? ''
    const dateTo = searchParams.get('date_to') ?? ''
    const sortBy = VALID_SORT.has(searchParams.get('sort_by') ?? '') ? (searchParams.get('sort_by') as string) : 'created_at'
    const sortAsc = searchParams.get('sort_order') === 'asc'

    // Intersected across every filter below that needs to resolve ids from
    // creators/brands first (search by name/handle, verified, featured) —
    // `null` means "no such filter applied," an empty array means
    // "applied, and it matched nothing."
    let allowedIds: string[] | null = null
    const intersect = (ids: string[]): string[] => (allowedIds ? allowedIds.filter((id) => ids.includes(id)) : ids)

    if (search) {
      const [{ data: byEmail }, { data: byCreator }, { data: byBrand }] = await Promise.all([
        supabase.from('users').select('id').ilike('email', `%${search}%`),
        supabase.from('creators').select('user_id').or(`display_name.ilike.%${search}%,username.ilike.%${search}%`),
        supabase.from('brands').select('user_id').ilike('company_name', `%${search}%`),
      ])
      allowedIds = intersect([
        ...(byEmail ?? []).map((u) => u.id),
        ...(byCreator ?? []).map((c) => c.user_id),
        ...(byBrand ?? []).map((b) => b.user_id),
      ])
    }

    if (verified) {
      const [{ data: creators }, { data: brands }] = await Promise.all([
        supabase.from('creators').select('user_id').eq('verification_status', verified),
        supabase.from('brands').select('user_id').eq('verification_status', verified),
      ])
      allowedIds = intersect([...(creators ?? []).map((c) => c.user_id), ...(brands ?? []).map((b) => b.user_id)])
    }

    if (featured) {
      const { data: creators } = await supabase.from('creators').select('user_id').eq('is_featured', true)
      allowedIds = intersect((creators ?? []).map((c) => c.user_id))
    }

    if (allowedIds !== null && allowedIds.length === 0) {
      return NextResponse.json({ users: [], total: 0, page, limit })
    }

    let query = supabase
      .from('users')
      .select('id, email, user_type, role, is_active, deleted_at, email_verified, created_at, last_login_at', { count: 'exact' })
      .order(sortBy, { ascending: sortAsc })
      .range((page - 1) * limit, page * limit - 1)

    // Deleted accounts are excluded from every default/active/suspended
    // view — only the super_admin-only `status=deleted` view (gated
    // above) shows them.
    if (status === 'deleted') {
      query = query.not('deleted_at', 'is', null)
    } else {
      query = query.is('deleted_at', null)
      if (status === 'active') {query = query.eq('is_active', true)}
      if (status === 'suspended') {query = query.eq('is_active', false)}
    }
    if (allowedIds !== null) {query = query.in('id', allowedIds)}
    if (userType !== 'all') {query = query.eq('user_type', userType)}
    if (role !== 'all') {query = query.eq('role', role)}
    if (dateFrom) {query = query.gte('created_at', dateFrom)}
    if (dateTo) {query = query.lte('created_at', dateTo + 'T23:59:59')}

    const { data: users, count, error } = await query
    if (error) {throw error}

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
    captureError(err, { route: 'GET /api/admin/users' })
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
