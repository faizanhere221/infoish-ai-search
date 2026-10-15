import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

// GET /api/campaign-creators/results-todo — creator-only: posted/completed
// deliverables that could use a results check-in. No cron — this is
// computed lazily on every read: flag a deliverable at the ~24h mark if it
// has no results yet, and again at the ~7d mark if it still has fewer than
// two entries (a quick suggested second check-in, not a hard requirement).
export async function GET(request: NextRequest) {
  try {
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    if (callerUserType !== 'creator' || !callerProfileId) {
      return NextResponse.json({ error: 'Only creators see this' }, { status: 403 })
    }

    const supabase = createServerSupabase()

    const { data: rows } = await supabase
      .from('campaign_creators')
      .select('id, campaign_id')
      .eq('creator_id', callerProfileId)

    const rowIds = (rows || []).map((r) => r.id)
    if (rowIds.length === 0) {
      return NextResponse.json({ todo: [] })
    }

    const { data: deliverables, error } = await supabase
      .from('creator_deliverables')
      .select('id, campaign_creator_id, title, posted_at, status')
      .in('campaign_creator_id', rowIds)
      .in('status', ['posted', 'completed'])
      .not('posted_at', 'is', null)

    if (error) {
      captureError(error, { route: 'GET /api/campaign-creators/results-todo' })
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
    }

    if (!deliverables || deliverables.length === 0) {
      return NextResponse.json({ todo: [] })
    }

    const deliverableIds = deliverables.map((d) => d.id)
    const { data: resultCounts } = await supabase
      .from('deliverable_results')
      .select('deliverable_id')
      .in('deliverable_id', deliverableIds)

    const countByDeliverable: Record<string, number> = {}
    for (const r of resultCounts || []) {
      countByDeliverable[r.deliverable_id] = (countByDeliverable[r.deliverable_id] || 0) + 1
    }

    const now = Date.now()
    const todo = deliverables.filter((d) => {
      const postedAt = new Date(d.posted_at as string).getTime()
      const elapsed = now - postedAt
      const count = countByDeliverable[d.id] || 0
      if (count === 0 && elapsed >= HOUR_MS * 24) {return true}
      if (count < 2 && elapsed >= DAY_MS * 7) {return true}
      return false
    })

    const rowToCampaign: Record<string, string> = {}
    for (const r of rows || []) {rowToCampaign[r.id] = r.campaign_id}

    const campaignIds = [...new Set(todo.map((d) => rowToCampaign[d.campaign_creator_id]).filter(Boolean))]
    const { data: campaigns } = campaignIds.length > 0
      ? await supabase.from('campaigns').select('id, title').in('id', campaignIds)
      : { data: [] }

    return NextResponse.json({
      todo: todo.map((d) => ({
        deliverable_id: d.id,
        campaign_creator_id: d.campaign_creator_id,
        title: d.title,
        campaign_title: campaigns?.find((c) => c.id === rowToCampaign[d.campaign_creator_id])?.title ?? null,
      })),
    })
  } catch (error) {
    captureError(error, { route: 'GET /api/campaign-creators/results-todo' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
