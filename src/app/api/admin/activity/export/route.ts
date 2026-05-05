import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('date_from') ?? ''
    const dateTo   = searchParams.get('date_to')   ?? ''
    const action   = searchParams.get('action')    ?? ''

    let query = supabase
      .from('activity_logs')
      .select('*, users:user_id(email)')
      .order('created_at', { ascending: false })
      .limit(50000)

    if (action)   query = query.eq('action', action)
    if (dateFrom) query = query.gte('created_at', dateFrom)
    if (dateTo)   query = query.lte('created_at', dateTo + 'T23:59:59')

    const { data: logs, error } = await query

    if (error) {
      if ((error as { code?: string }).code === '42P01') {
        return new NextResponse('id,action,email,entity_type,ip_address,created_at\n', {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="activity_logs.csv"',
          },
        })
      }
      throw error
    }

    const headers = ['ID', 'Action', 'Email', 'Entity Type', 'Entity ID', 'IP Address', 'Details', 'Created At']
    const rows = (logs ?? []).map(l => [
      l.id,
      l.action,
      (l.users as { email?: string } | null)?.email ?? '',
      l.entity_type ?? '',
      l.entity_id ?? '',
      l.ip_address ?? '',
      JSON.stringify(l.details ?? {}),
      new Date(l.created_at).toISOString(),
    ])

    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="activity_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (err) {
    console.error('Activity export error:', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
