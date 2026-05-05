import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabase()
    const { searchParams } = new URL(request.url)
    const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1'))
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20'))

    const { data: logs, count, error } = await supabase
      .from('activity_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', params.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (error) {
      if ((error as { code?: string }).code === '42P01') {
        return NextResponse.json({ logs: [], total: 0, page, limit })
      }
      throw error
    }

    return NextResponse.json({ logs: logs ?? [], total: count ?? 0, page, limit })
  } catch (err) {
    console.error('User activity error:', err)
    return NextResponse.json({ error: 'Failed to fetch user activity' }, { status: 500 })
  }
}
